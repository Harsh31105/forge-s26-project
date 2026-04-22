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
import { TraceRepositorySchema } from "../src/storage/postgres/schema/trace";
import { professor } from "../src/storage/tables/professor";
import { course } from "../src/storage/tables/course";
import { department } from "../src/storage/tables/department";
import { Semester } from "../src/models/trace";
import { trace } from "../src/storage/tables/trace";

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "us-east-2" });
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
    section: string | null;
    lectureType: string | null;
    hoursDevoted: Record<string, number>;
    proffesorEfficency: number | null;
    howOftenPercentage: Record<string, number>;
  };
}

function normalizeSemester(semester: string): Semester | null {
  if (semester === "summer") return "summer_1";
  if (
    semester === "fall" ||
    semester === "spring" ||
    semester === "summer_1" ||
    semester === "summer_2"
  ) {
    return semester;
  }

  return null;
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
      const filename = key.split("/").pop()!;
      const sectionMatch = filename.match(/section-(\w+)/);
      const section = sectionMatch ? sectionMatch[1] : null;
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
        const normalizedSemester = normalizeSemester(schema.trace.semester);
        if (!normalizedSemester) {
          console.warn(`✗ invalid semester "${schema.trace.semester}": ${key}`);
          stats.failed++;
          continue;
        }

        // resolve department id

        if (!deptCache.has(deptName)) {
          let [row] = await db
            .select()
            .from(department)
            .where(eq(department.name, deptName));
          if (!row) {
            console.log(`⚠ unknown dept "${deptName}", creating new record`);
            [row] = await db
              .insert(department)
              .values({ name: deptName })
              .returning();
          }

          deptCache.set(deptName, row!.id);
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
        const courseRow = existingCourses[0];
        if (!courseRow) {
          console.warn(
            `✗ course not found in DB, skipping trace to avoid blank description: ${deptName} ${courseCode} ${schema.course.name}`,
          );
          stats.skipped++;
          continue;
        }

        // insert trace using TraceRepositorySchema
        const t = schema.trace;
        const existingTrace = await db
          .select()
          .from(trace)
          .where(
            and(
              eq(trace.courseId, courseRow.id),
              eq(trace.professorId, prof.id),
              eq(trace.semester, normalizedSemester),
              eq(trace.lectureYear, t.lectureYear),
              eq(trace.section, section),
            ),
          );

        if (existingTrace.length === 0) {
          await traceRepo.createTrace({
            courseId: courseRow.id,
            professorId: prof.id,
            courseName: t.courseName,
            departmentId: deptId,
            courseCode: Number(t.courseCode),
            semester: normalizedSemester,
            lectureYear: t.lectureYear,
            section: section,
            lectureType: (t.lectureType as any) ?? null,
            hoursDevoted: t.hoursDevoted ?? null,
            professorEfficiency: t.proffesorEfficency ?? null,
            howOftenPercentage: t.howOftenPercentage ?? null,
          });
        } else {
          console.log(`⏭ duplicate trace, skipping ${key}`);
          stats.skipped++;
        }

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
