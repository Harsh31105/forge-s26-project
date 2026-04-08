import "dotenv/config";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and } from "drizzle-orm";
import { dbConfig, getConnectionString } from "../src/config/db";
import { ProfessorRepositorySchema } from "../src/storage/postgres/schema/professor";
import { CourseRepositorySchema } from "../src/storage/postgres/schema/course";
import { TraceRepositorySchema } from "../src/storage/postgres/schema/trace";
import { professor } from "../src/storage/tables/professor";
import { course } from "../src/storage/tables/course";
import { department } from "../src/storage/tables/department";
import { Semester } from "../src/models/trace";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET = "forge-s26-trace-evaluations";
const PREFIX = "extracted/trace-evaluations/";

interface TraceJSON {
  source: string;
  professor: { firstName: string; lastName: string; tags: string[] };
  course: {
    name: string;
    course_code: string | number;
    num_credits: number | null;
    lecture_type: string | null;
  };
  trace: {
    courseName: string;
    courseCode: string | number;
    semester: string;
    lectureYear: number;
    lectureType: string | null;
    hoursDevoted: Record<string, number>;
    proffesorEfficency: number | null;
    howOftenPercentage: Record<string, number>;
  };
}

async function streamToString(stream: any): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf-8");
}

async function main() {
  const pool = new Pool({ connectionString: getConnectionString(dbConfig) });
  const db = drizzle(pool);
  const profRepo = new ProfessorRepositorySchema(db);
  const courseRepo = new CourseRepositorySchema(db);
  const traceRepo = new TraceRepositorySchema(db);
  const stats = { success: 0, skipped: 0, failed: 0 };

  // cache department name → id lookups
  const deptCache = new Map<string, number>();

  let continuationToken: string | undefined;
  do {
    const list = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: PREFIX,
        ContinuationToken: continuationToken,
      }),
    );

    for (const obj of list.Contents ?? []) {
      const key = obj.Key!;
      if (!key.endsWith(".json")) continue;

      // key shape: extracted/trace-evaluations/<DEPT>/undefined/<semester>/file.json
      const parts = key.split("/");
      const deptName = parts[2];

      // download
      let raw: string;
      try {
        const resp = await s3.send(
          new GetObjectCommand({ Bucket: BUCKET, Key: key }),
        );
        raw = await streamToString(resp.Body);
      } catch (e) {
        console.error(`✗ download failed ${key}: ${e}`);
        stats.failed++;
        continue;
      }

      if (!raw || raw.trim() === "null") {
        stats.skipped++;
        continue;
      }

      let schema: TraceJSON;
      try {
        schema = JSON.parse(raw);
      } catch {
        console.warn(`✗ invalid JSON: ${key}`);
        stats.failed++;
        continue;
      }

      try {
        // resolve department id
        if (!deptCache.has(deptName)) {
          const [row] = await db
            .select()
            .from(department)
            .where(eq(department.name, deptName));
          if (!row) {
            console.warn(`⚠ unknown dept "${deptName}", skipping`);
            stats.skipped++;
            continue;
          }
          deptCache.set(deptName, row.id);
        }
        const deptId = deptCache.get(deptName)!;

        // upsert professor — find by name, create if missing
        const existingProfs = await db
          .select()
          .from(professor)
          .where(
            and(
              eq(professor.firstName, schema.professor.firstName),
              eq(professor.lastName, schema.professor.lastName),
            ),
          );
        const prof =
          existingProfs[0] ??
          (await profRepo.createProfessor({
            firstName: schema.professor.firstName,
            lastName: schema.professor.lastName,
          }));

        // upsert course — find by (course_code, department_id), create if missing
        const courseCode = Number(schema.course.course_code);
        const existingCourses = await db
          .select()
          .from(course)
          .where(
            and(
              eq(course.courseCode, courseCode),
              eq(course.departmentId, deptId),
            ),
          );
        const courseRow =
          existingCourses[0] ??
          (await courseRepo.createCourse({
            name: schema.course.name,
            department_id: deptId,
            course_code: courseCode,
            description: "",
            num_credits: schema.course.num_credits ?? 4,
            lecture_type: (schema.course.lecture_type as any) ?? undefined,
          }));

        // insert trace using TraceRepositorySchema
        const t = schema.trace;
        await traceRepo.createTrace({
          courseId: courseRow.id,
          professorId: prof.id,
          courseName: t.courseName,
          departmentId: deptId,
          courseCode: Number(t.courseCode),
          semester: t.semester as Semester,
          lectureYear: t.lectureYear,
          lectureType: (t.lectureType as any) ?? null,
          hoursDevoted: t.hoursDevoted ?? null,
          professorEfficiency: t.proffesorEfficency ?? null,
          howOftenPercentage: t.howOftenPercentage ?? null,
        });

        console.log(`✓ ${key}`);
        stats.success++;
      } catch (e) {
        console.error(`✗ DB error ${key}: ${e}`);
        stats.failed++;
      }
    }

    continuationToken = list.NextContinuationToken;
  } while (continuationToken);

  console.log(
    `\nDone — success: ${stats.success}, skipped: ${stats.skipped}, failed: ${stats.failed}`,
  );
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
