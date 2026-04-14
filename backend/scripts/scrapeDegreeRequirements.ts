import "dotenv/config";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { Pool } from "pg";
import { dbConfig, getConnectionString } from "../src/config/db";

const BSCS_URL =
  "https://catalog.northeastern.edu/undergraduate/computer-information-science/computer-science/bscs/#programrequirementstext";
const MAJOR_NAME = "Computer Science";

interface DegreeRequirement {
  department: string;
  courseCode: number;
  required: boolean;
}

export function parseCourseCode(
  text: string,
): { department: string; courseCode: number } | null {
  const match = text.trim().match(/^([A-Z]+)\s+(\d{4,5})$/);
  if (!match) {
    return null;
  }
  return {
    department: match[1]!,
    courseCode: parseInt(match[2]!, 10),
  };
}

export function isChooseSection(headerText: string): boolean {
  const lower = headerText.toLowerCase();

  // "Complete all of the following" is never a choose section
  if (lower.includes("complete all")) return false;

  return (
    lower.includes("choose") ||
    lower.includes("select") ||
    lower.includes("elective") ||
    lower.includes("of the following") || // "one of", "two of", "any of", etc.
    lower.includes("from the following") ||
    lower.includes("complete any") || // "complete any two courses", etc.
    /complete\s+\d+/.test(lower) // "complete 1", "complete 2", etc.
  );
}

interface TableSection {
  isChoice: boolean;
  rows: AnyNode[];
}

// split table into sections delimited by areaheader rows, choice section if it is a "complete/choose one of the following":
export function buildSections(
  $: cheerio.CheerioAPI,
  table: AnyNode,
): TableSection[] {
  const sections: TableSection[] = [];
  let currentIsChoice = false;
  let currentHoursRequired: number | null = null;
  let currentRows: AnyNode[] = [];

  const flush = () => {
    if (currentRows.length === 0) return;

    let isChoice = currentIsChoice;
    if (!isChoice && currentHoursRequired !== null) {
      const courseRowCount = currentRows.filter(
        (r) => $(r).find("td.codecol a").length > 0,
      ).length;
      // if required hours < all courses × 4 credits, only a subset is needed
      if (courseRowCount > 0 && currentHoursRequired < courseRowCount * 4) {
        isChoice = true;
      }
    }

    sections.push({ isChoice, rows: currentRows });
    currentRows = [];
  };

  $(table)
    .find("tr")
    .each((_i, row) => {
      const classes = ($(row).attr("class") || "").split(/\s+/);

      if (classes.includes("areaheader")) {
        flush();
        const headerText = $(row).text().trim();
        currentIsChoice = isChooseSection(headerText);
        currentHoursRequired = null;
        return;
      }

      const commentSpan = $(row).find(
        "span.courselistcomment:not(.areaheader)",
      );
      if (commentSpan.length > 0) {
        flush();
        const commentText = commentSpan.text().trim();
        const hoursText = $(row).find("td.hourscol").text().trim();
        if (isChooseSection(commentText)) {
          currentIsChoice = true;
        } else if (commentText.toLowerCase().includes("complete all")) {
          currentIsChoice = false;
        }
        // neutral labels (e.g. "Biology", "Mathematics") inherit current isChoice
        currentHoursRequired = hoursText ? parseInt(hoursText, 10) : null;
        return;
      }

      currentRows.push(row);
    });

  flush();
  return sections;
}

async function scrapeRequirements(): Promise<DegreeRequirement[]> {
  console.log(`Fetching ${BSCS_URL} ...`);
  const res = await fetch(BSCS_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch catalog page: ${res.status}`);
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const requirements: DegreeRequirement[] = [];
  const seen = new Set<string>();

  $("table.sc_courselist").each((_tableIdx, table) => {
    const sections = buildSections($, table);

    for (const section of sections) {
      for (const row of section.rows) {
        const classes = ($(row).attr("class") || "").split(/\s+/);

        // or row, choice
        if (classes.includes("orclass")) {
          $(row)
            .find("td.codecol a")
            .each((_i, el) => {
              const parsed = parseCourseCode($(el).text());
              if (parsed) {
                const key = `${parsed.department}|${parsed.courseCode}`;
                if (!seen.has(key)) {
                  seen.add(key);
                  requirements.push({ ...parsed, required: false });
                }
              }
            });
          continue;
        }

        // regular course row
        if (
          classes.includes("even") ||
          classes.includes("odd") ||
          classes.includes("firstrow")
        ) {
          const courseLinks = $(row).find("td.codecol a");
          if (courseLinks.length === 0) continue;

          // if the next row is an orclass, this row is the first of an OR group
          const nextRowClasses = ($(row).next("tr").attr("class") || "").split(
            /\s+/,
          );
          const nextIsOrClass = nextRowClasses.includes("orclass");
          const isRequired = !section.isChoice && !nextIsOrClass;

          courseLinks.each((_i, el) => {
            const parsed = parseCourseCode($(el).text());
            if (parsed) {
              const key = `${parsed.department}|${parsed.courseCode}`;
              if (!seen.has(key)) {
                seen.add(key);
                requirements.push({ ...parsed, required: isRequired });
              }
            }
          });
        }
      }
    }
  });

  return requirements;
}

async function main() {
  const pool = new Pool({ connectionString: getConnectionString(dbConfig) });

  try {
    // create BSCS major
    let majorId: number;
    const majorRes = await pool.query<{ id: number }>(
      "SELECT id FROM major WHERE name = $1",
      [MAJOR_NAME],
    );

    if (majorRes.rows.length === 0) {
      const ins = await pool.query<{ id: number }>(
        "INSERT INTO major (name) VALUES ($1) RETURNING id",
        [MAJOR_NAME],
      );
      majorId = ins.rows[0]!.id;
      console.log(`Created major "${MAJOR_NAME}" with id=${majorId}`);
    } else {
      majorId = majorRes.rows[0]!.id;
      console.log(`Found major "${MAJOR_NAME}" with id=${majorId}`);
    }

    // scrape requirements
    const requirements = await scrapeRequirements();
    console.log(`Scraped ${requirements.length} course requirements.`);

    // insert into degree requirements
    let inserted = 0;
    let skipped = 0;

    for (const req of requirements) {
      // looks up course by department name and course code
      const courseRes = await pool.query<{ id: string }>(
        `SELECT c.id
                 FROM course c
                 JOIN department d ON c.department_id = d.id
                 WHERE d.name = $1
                   AND c.course_code = $2
                 LIMIT 1`,
        [req.department, req.courseCode],
      );

      if (courseRes.rows.length === 0) {
        console.warn(
          `  SKIP: ${req.department} ${req.courseCode} — not found in course table`,
        );
        skipped++;
        continue;
      }

      const courseId = courseRes.rows[0]!.id;

      // if the record already exists, update required flag
      await pool.query(
        `INSERT INTO degree_requirement (course_id, major_id, required)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (course_id, major_id)
                 DO UPDATE SET required = EXCLUDED.required, updated_at = NOW()`,
        [courseId, majorId, req.required],
      );

      console.log(
        `  ${req.required ? "REQUIRED" : "CHOICE  "} — ${req.department} ${req.courseCode}`,
      );
      inserted++;
    }

    console.log(
      `\nDone. Inserted/updated: ${inserted}, skipped (not in DB): ${skipped}`,
    );
  } finally {
    await pool.end();
  }
}

// Only run when executed directly, not when imported by tests
if (process.env.NODE_ENV !== "test") {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
