/**
 * TRACE scrape-to-S3 helper for the new Bluera (Blue by Explorance) platform.
 *
 * Default flow:
 * 1. Launch a browser with a persistent profile.
 * 2. Log into TRACE via Northeastern SSO (first run, non-headless).
 * 3. Navigate to the semester report list page.
 * 4. The script collects all report links (paginating automatically).
 * 5. It opens each report, generates a PDF via page.pdf(), uploads to S3,
 *    and appends a manifest entry.
 *
 * Two-step headless workflow:
 *   Step 1 (interactive): run without --headless to log in and collect URLs.
 *   Step 2 (headless):    re-run with --headless to process saved URLs.
 *
 * Example:
 *   npx ts-node scripts/scrape-trace-bluera-to-s3.ts \
 *     --department CS \
 *     --semester-url "https://northeastern-bc.bluera.com/rpvlf.aspx?rid=..."
 *
 * Headless re-run:
 *   npx ts-node scripts/scrape-trace-bluera-to-s3.ts \
 *     --department CS --headless
 */
import "dotenv/config";

import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import process from "process";
import { createInterface } from "readline/promises";

import {
  chromium,
  type BrowserContext,
  type Page,
} from "playwright";

import { s3Config } from "../src/config/s3";
import {
  TraceDocumentRepositoryS3,
  type TraceDocumentKey,
} from "../src/storage/s3/traceDocuments";

const DEFAULT_USER_DATA_DIR = path.resolve(process.cwd(), ".trace-playwright");
const DEFAULT_MANIFEST_PATH = path.resolve(
  process.cwd(),
  "scripts/output/trace-scrape-manifest.json",
);
const SAVED_REPORT_URLS_PATH = path.resolve(
  process.cwd(),
  ".trace-playwright/saved-bluera-report-urls.json",
);

const BLUERA_HOME = "https://northeastern.bluera.com/";
const BLUERA_REPORTS_PAGE = "https://northeastern.bluera.com/reports";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CliOptions {
  department: string;
  courseCode?: number;
  semesterUrl?: string;
  filter?: string;
  term?: string;
  limit?: number;
  headless: boolean;
  userDataDir: string;
  manifestPath: string;
  dryRun: boolean;
}

interface ScrapedReportMetadata {
  reportUrl: string;
  pdfUrl: string;
  courseTitle: string;
  instructor: string;
  section: string;
  courseId: string;
  termLabel: string;
  semester: string;
  lectureYear: number;
  sourceId: string;
}

interface TraceManifestEntry extends ScrapedReportMetadata {
  department: string;
  courseCode?: number;
  s3Key: string;
  uploadedAt: string;
}

function printUsage(): void {
  console.log(`
Usage:
  npx ts-node scripts/scrape-trace-bluera-to-s3.ts --department CS [options]

Required:
  --department <value>       Department prefix for S3 path (e.g. CS)

Optional:
  --course-code <value>      Course code filter (e.g. 3000). Only scrape matching reports.
  --semester-url <url>       Direct URL to a Bluera report list page (rpvlf.aspx?...)
  --filter <text>            Only include reports whose title contains this text (e.g. "CS" or "CS3000")
  --term <value>             Term label (e.g. "Fall 2025"). Overrides auto-detection.
  --limit <n>                Stop after n reports
  --user-data-dir <path>     Persistent Playwright profile location
  --manifest-path <path>     JSON manifest output path
  --headless                 Run browser headless (requires prior interactive run)
  --dry-run                  Skip S3 upload; print would-be keys
  --help                     Show this help text
`);
}

function parseArgs(argv: string[]): Map<string, string | boolean> {
  const args = new Map<string, string | boolean>();

  for (let idx = 0; idx < argv.length; idx += 1) {
    const token = argv[idx]!;
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[idx + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, true);
    } else {
      args.set(key, next);
      idx += 1;
    }
  }

  return args;
}

function getStringArg(
  args: Map<string, string | boolean>,
  key: string,
): string | undefined {
  const value = args.get(key);
  return typeof value === "string" ? value : undefined;
}

function getBooleanArg(
  args: Map<string, string | boolean>,
  key: string,
): boolean {
  return args.get(key) === true;
}

function parseOptions(argv: string[]): CliOptions {
  const args = parseArgs(argv);

  if (getBooleanArg(args, "help")) {
    printUsage();
    process.exit(0);
  }

  const department = getStringArg(args, "department");
  if (!department) {
    printUsage();
    throw new Error("--department is required.");
  }

  const courseCodeValue = getStringArg(args, "course-code");
  let courseCode: number | undefined;
  if (courseCodeValue) {
    courseCode = Number(courseCodeValue);
    if (!Number.isInteger(courseCode) || courseCode <= 0) {
      throw new Error(`Invalid --course-code value: ${courseCodeValue}`);
    }
  }

  const limitValue = getStringArg(args, "limit");
  const limit = limitValue ? Number(limitValue) : undefined;
  if (limitValue && (!Number.isInteger(limit) || limit! <= 0)) {
    throw new Error(`Invalid --limit value: ${limitValue}`);
  }

  const options: CliOptions = {
    department,
    headless: getBooleanArg(args, "headless"),
    userDataDir: getStringArg(args, "user-data-dir") ?? DEFAULT_USER_DATA_DIR,
    manifestPath:
      getStringArg(args, "manifest-path") ?? DEFAULT_MANIFEST_PATH,
    dryRun: getBooleanArg(args, "dry-run"),
  };

  if (courseCode !== undefined) options.courseCode = courseCode;
  if (limit !== undefined) options.limit = limit;
  const semesterUrl = getStringArg(args, "semester-url");
  if (semesterUrl !== undefined) options.semesterUrl = semesterUrl;
  const filter = getStringArg(args, "filter");
  if (filter !== undefined) options.filter = filter;
  const term = getStringArg(args, "term");
  if (term !== undefined) options.term = term;

  return options;
}

// ---------------------------------------------------------------------------
// Utility helpers (reused from the old script)
// ---------------------------------------------------------------------------

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSemester(termLabel: string): string {
  const normalized = termLabel.trim().toLowerCase();

  if (normalized.startsWith("spring a")) return "spring_a";
  if (normalized.startsWith("spring")) return "spring";
  if (normalized.startsWith("full summer")) return "summer_full";
  if (normalized.startsWith("summer 1")) return "summer_1";
  if (normalized.startsWith("summer 2")) return "summer_2";
  if (normalized.startsWith("summer")) return "summer";
  if (normalized.startsWith("fall a")) return "fall_a";
  if (normalized.startsWith("fall")) return "fall";

  return slugify(termLabel).replace(/-/g, "_");
}

function extractLectureYear(termLabel: string): number {
  const match = termLabel.match(/\b(20\d{2})/);
  if (!match) {
    throw new Error(
      `Could not parse lecture year from term label: "${termLabel}"`,
    );
  }
  return Number(match[1]);
}

function buildSourceId(reportUrl: string, instructor: string): string {
  const hash = createHash("sha1").update(reportUrl).digest("hex").slice(0, 10);
  return [slugify(instructor) || "instructor", hash]
    .filter((part) => part.length > 0)
    .join("-")
    .slice(0, 180);
}

async function promptForEnter(message: string): Promise<void> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  await rl.question(message);
  rl.close();
}

function requireEnv(name: string): void {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Manifest helpers (reused from the old script)
// ---------------------------------------------------------------------------

async function appendManifest(
  manifestPath: string,
  entry: TraceManifestEntry,
): Promise<void> {
  await mkdir(path.dirname(manifestPath), { recursive: true });

  let manifest: TraceManifestEntry[] = [];
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      manifest = parsed as TraceManifestEntry[];
    }
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }

  manifest.push(entry);
  await writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

async function readManifestEntries(
  manifestPath: string,
): Promise<TraceManifestEntry[]> {
  try {
    const raw = await readFile(manifestPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as TraceManifestEntry[];
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return [];
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Bluera-specific: parsing report titles
// ---------------------------------------------------------------------------

/**
 * Parse a Bluera report list title like:
 *   "Student TRACE report for AACE6000-01 Arts and Culture Leadership (Diana Arcadipone)"
 *   "Student TRACE report for CS3000-02 Algorithms & Data (John Smith)"
 *
 * Returns department, courseCode, section, courseName, and instructor.
 */
interface ParsedReportTitle {
  department: string;
  courseCode: number;
  section: string;
  courseName: string;
  instructor: string;
}

function parseReportTitle(title: string): ParsedReportTitle | null {
  // Match pattern: "... for DEPT CODE-SECTION CourseName (Instructor)"
  const match = title.match(
    /for\s+([A-Z]{2,6})(\d{4})-(\d{1,3})\s+(.+?)\s*\(([^)]+)\)\s*$/,
  );
  if (!match) return null;

  return {
    department: match[1]!,
    courseCode: Number(match[2]!),
    section: match[3]!,
    courseName: match[4]!.trim(),
    instructor: match[5]!.trim(),
  };
}

// ---------------------------------------------------------------------------
// Bluera-specific: session management
// ---------------------------------------------------------------------------

async function isLoggedIn(page: Page): Promise<boolean> {
  // Check if we're on a Bluera page with content (not a login/redirect page)
  const url = page.url();
  return (
    url.includes("bluera.com") &&
    !url.includes("/oauth2/") &&
    !url.includes("/login")
  );
}

async function ensureBluearaSession(
  page: Page,
  headless: boolean,
): Promise<void> {
  console.log(`Opening Bluera reports page: ${BLUERA_REPORTS_PAGE}`);
  await page.goto(BLUERA_REPORTS_PAGE, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);

  if (await isLoggedIn(page)) {
    console.log(`Bluera session established. Current URL: ${page.url()}`);
    return;
  }

  if (headless) {
    throw new Error(
      "Bluera session not found in the saved browser profile.\n" +
        "Run once without --headless to log in and save the session, then re-run with --headless.",
    );
  }

  console.log("");
  console.log("=== Manual Login Required ===");
  console.log("In the browser that opened, please:");
  console.log("  1. Log in through Northeastern SSO (Duo 2FA)");
  console.log("  2. Make sure you can see the TRACE reports page");
  console.log("");
  await promptForEnter(
    "Press Enter here once you are logged into TRACE...",
  );

  if (!(await isLoggedIn(page))) {
    throw new Error(
      "Still not logged into Bluera after manual login.\n" +
        `Current URL: ${page.url()}\n` +
        "Make sure you complete the full SSO login before pressing Enter.",
    );
  }

  console.log(`Bluera session established. Current URL: ${page.url()}`);
}

// ---------------------------------------------------------------------------
// Bluera-specific: collect report links from the report list page
// ---------------------------------------------------------------------------

interface ReportListEntry {
  url: string;
  title: string;
}

async function collectReportUrlsFromList(
  page: Page,
  filter?: string,
  limit?: number,
): Promise<ReportListEntry[]> {
  const entries: ReportListEntry[] = [];
  const seenTitles = new Set<string>();

  // Use the page's built-in search to narrow results before scraping.
  // This avoids paginating through 500+ pages of 10 results each.
  if (filter) {
    console.log(`Searching for "${filter}" using the page search bar...`);
    const searchInput = page.locator("input[aria-label='Search report title']").first();
    const searchVisible = await searchInput.isVisible().catch(() => false);
    if (searchVisible) {
      await searchInput.fill(filter);
      // Submit the search via the search button or Enter key
      const searchButton = page.locator("input[value='Search report title']").first();
      const searchBtnVisible = await searchButton.isVisible().catch(() => false);
      if (searchBtnVisible) {
        await searchButton.click();
      } else {
        await searchInput.press("Enter");
      }
      await page.waitForLoadState("networkidle").catch(() => undefined);
      await page.waitForTimeout(3000);

      // Check results count
      const bodyText = await page.locator("body").innerText().catch(() => "");
      const countMatch = bodyText.match(/(\d+)\s+Item/i);
      if (countMatch) {
        console.log(`Search returned ${countMatch[1]} results.`);
      }
    } else {
      console.log("Search bar not found, will paginate through all results.");
    }
  }

  // Save debug HTML on the first page
  const pageHtml = await page.content().catch(() => "");
  const debugPath = path.join(process.cwd(), "bluera-debug-page.html");
  await writeFile(debugPath, pageHtml, "utf8").catch(() => undefined);
  console.log(`DEBUG: Full page HTML saved to ${debugPath}`);
  console.log(`DEBUG: Current URL: ${page.url()}`);

  while (true) {
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2000);

    // The rpvlf.aspx page is an ASP.NET WebForms page.
    // Each report row has an <a> tag with:
    //   href="rpvf-eng.aspx?...SelectedIDforPrint=<hex_id>...&ReportType=2..."
    //   text="Student TRACE report for DEPT CODE-SECTION Course Name (Instructor)"

    const pageEntries = await page.evaluate(() => {
      const results: Array<{ title: string; href: string }> = [];
      const links = document.querySelectorAll("a[href*='SelectedIDforPrint']");
      for (const link of links) {
        const title = link.textContent?.trim() ?? "";
        const href = link.getAttribute("href") ?? "";
        if (title && href) {
          results.push({ title, href });
        }
      }
      return results;
    });

    console.log(`Found ${pageEntries.length} report(s) on current page.`);

    if (pageEntries.length === 0) {
      const bodyText = await page.locator("body").innerText().catch(() => "");
      console.log("DEBUG: Page text preview (first 500 chars):");
      console.log(bodyText.slice(0, 500));
      break;
    }

    const sizeBefore = seenTitles.size;
    for (const entry of pageEntries) {
      if (seenTitles.has(entry.title)) continue;
      seenTitles.add(entry.title);

      const reportUrl = new URL(entry.href, page.url()).toString();
      entries.push({ url: reportUrl, title: entry.title });
      if (limit && entries.length >= limit) break;
    }

    if (limit && entries.length >= limit) break;

    // If no new reports were found on this page, we're looping — stop
    if (seenTitles.size === sizeBefore) {
      console.log("No new reports on this page. Done paginating.");
      break;
    }

    // Pagination: ASP.NET WebForms uses __doPostBack links.
    // Page numbers (2, 3, ..., 10) and "..." to advance to the next batch.
    // Strategy: find the highest numbered page link or "..." and click it.
    // The "..." link loads the next set of page numbers.

    // Find a visible "..." or numbered page link to advance.
    // There are duplicate pagination bars (top + bottom), so only click visible ones.
    // Use page.evaluate to find the right link and click it via JS.

    // Find which link to click (without clicking yet).
    // ASP.NET pagination: the current page is a <span> (not a link).
    // Other pages are <a> links. We want current page + 1.
    const nextTarget = await page.evaluate(() => {
      // The pagination area has <span>N</span> for current and <a>N</a> for others.
      // Find all __doPostBack links
      const allLinks = Array.from(
        document.querySelectorAll("a[href*='__doPostBack']"),
      );

      // Build a map of visible page links: number -> index
      const visibleLinks = new Map<number, number>();
      let hasEllipsis = -1;

      for (let i = 0; i < allLinks.length; i++) {
        const link = allLinks[i]!;
        if ((link as HTMLElement).offsetParent === null) continue; // skip hidden
        const text = link.textContent?.trim() ?? "";
        if (text === "...") {
          hasEllipsis = i;
          continue;
        }
        const num = Number(text);
        if (num > 0) {
          visibleLinks.set(num, i);
        }
      }

      // Figure out current page: find a <span> inside the pagination area
      // that contains just a number and is NOT inside an <a>
      let currentPage = 1;
      const spans = document.querySelectorAll("span");
      for (const span of spans) {
        const text = span.textContent?.trim() ?? "";
        const num = Number(text);
        if (num > 0 && num <= 1000 && !span.closest("a")) {
          // Check if this span is near page links (in the pagination area)
          const parent = span.parentElement;
          if (parent && parent.querySelector("a[href*='__doPostBack']")) {
            currentPage = num;
            break;
          }
        }
      }

      const nextPage = currentPage + 1;

      // Try clicking the next page number
      if (visibleLinks.has(nextPage)) {
        return { index: visibleLinks.get(nextPage)!, label: `page-${nextPage}` };
      }

      // If next page isn't visible, try "..." to load more page numbers
      if (hasEllipsis >= 0) {
        return { index: hasEllipsis, label: "ellipsis" };
      }

      return null;
    });

    if (!nextTarget) {
      console.log("No more pages to paginate.");
      break;
    }

    console.log(`  Navigating to ${nextTarget.label}...`);

    // Click the link and wait for the postback navigation to complete
    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => undefined),
        page
          .locator("a[href*='__doPostBack']")
          .nth(nextTarget.index)
          .click({ timeout: 5000 })
          .catch(() => {
            // If click fails, try via JS
            return page.evaluate((idx) => {
              const links = document.querySelectorAll("a[href*='__doPostBack']");
              (links[idx] as HTMLElement)?.click();
            }, nextTarget.index);
          }),
      ]);
    } catch {
      // Navigation may destroy context — that's OK
    }
    await page.waitForLoadState("domcontentloaded").catch(() => undefined);
    await page.waitForLoadState("networkidle").catch(() => undefined);
    await page.waitForTimeout(2000);

    console.log(`Collected ${entries.length} report(s) so far...`);
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Bluera-specific: scrape individual report
// ---------------------------------------------------------------------------

async function scrapeReportFromPage(
  page: Page,
  reportUrl: string,
  termLabel: string,
): Promise<ScrapedReportMetadata> {
  await page.goto(reportUrl, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => undefined);
  await page.waitForTimeout(2000);

  // Extract term from cover page: .cover-page-project-title dd span
  let extractedTerm = termLabel;
  try {
    const termSpan = page.locator(".cover-page-project-title dd span, #BlockLayoutController1ff4468d-49dd-46b3-9f34-8351c8d6382a_ctl04_ProjectTitle").first();
    const termText = await termSpan.textContent().catch(() => null);
    if (termText?.trim()) {
      extractedTerm = termText.trim();
    }
  } catch {
    // Fall back to the provided term label
  }

  // Extract course title and instructor from h2
  let courseTitle = "";
  let instructor = "";
  try {
    const h2 = page.locator("header.cover-page h2").first();
    const h2Text = (await h2.textContent())?.trim() ?? "";

    // Parse: "Student TRACE report for CourseName (Instructor)"
    const instructorMatch = h2Text.match(/\(([^)]+)\)\s*$/);
    if (instructorMatch) {
      instructor = instructorMatch[1]!.trim();
      courseTitle = h2Text
        .replace(/\(([^)]+)\)\s*$/, "")
        .replace(/^Student TRACE report for\s*/i, "")
        .trim();
    } else {
      courseTitle = h2Text;
    }
  } catch {
    // Skip if can't parse
  }

  const semester = normalizeSemester(extractedTerm);
  const lectureYear = extractLectureYear(extractedTerm);

  // Generate PDF from the page itself since Bluera doesn't provide PDF links
  const pdfUrl = reportUrl; // We use page.pdf() instead of downloading

  return {
    reportUrl,
    pdfUrl,
    courseTitle,
    instructor,
    section: "",
    courseId: "",
    termLabel: extractedTerm,
    semester,
    lectureYear,
    sourceId: buildSourceId(reportUrl, instructor),
  };
}

async function generatePdfFromPage(page: Page): Promise<Buffer> {
  return Buffer.from(
    await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", bottom: "0.5in", left: "0.5in", right: "0.5in" },
    }),
  );
}

// ---------------------------------------------------------------------------
// Bluera-specific: navigate to semester report list
// ---------------------------------------------------------------------------

/**
 * From the semester picker page (rv.aspx), find and click a semester link.
 * The page shows links like "Instructors reports for Fall 2025".
 */
async function collectSemesterLinks(
  page: Page,
): Promise<Array<{ label: string; url: string }>> {
  const links: Array<{ label: string; url: string }> = [];

  const anchors = await page.locator("a").filter({ hasText: /reports for/ }).all();
  for (const anchor of anchors) {
    const text = (await anchor.textContent())?.trim() ?? "";
    const href = await anchor.getAttribute("href");
    if (href) {
      links.push({
        label: text,
        url: new URL(href, page.url()).toString(),
      });
    }
  }

  return links;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));

  if (!options.dryRun) {
    requireEnv("AWS_ACCESS_KEY_ID");
    requireEnv("AWS_SECRET_ACCESS_KEY");
    requireEnv("AWS_REGION");
    requireEnv("S3_BUCKET_NAME");
  }

  const repo = options.dryRun
    ? undefined
    : new TraceDocumentRepositoryS3(s3Config);

  const context = await chromium.launchPersistentContext(options.userDataDir, {
    headless: options.headless,
  });

  try {
    const page = context.pages()[0] ?? (await context.newPage());
    let reportEntries: ReportListEntry[] = [];
    let termLabel = options.term ?? ""; // Use --term if provided, otherwise auto-detect

    if (options.headless) {
      // In headless mode, load saved report URLs from a prior interactive run.
      try {
        const saved = await readFile(SAVED_REPORT_URLS_PATH, "utf8");
        const parsed = JSON.parse(saved) as Array<{
          url: string;
          title: string;
          termLabel?: string;
        }>;
        reportEntries = parsed.map((entry) => ({
          url: entry.url,
          title: entry.title,
        }));
        // Only use saved termLabel if --term wasn't provided
        if (!termLabel) {
          termLabel = parsed[0]?.termLabel ?? "";
        }
        console.log(
          `Headless mode: loaded ${reportEntries.length} saved report URLs.`,
        );
      } catch {
        throw new Error(
          "No saved report URLs found. Run once without --headless to collect and save them first.",
        );
      }
    } else {
      // Interactive mode: log in and collect report URLs.
      await ensureBluearaSession(page, options.headless);

      if (options.semesterUrl) {
        // Go directly to the provided semester report list URL
        console.log(`Navigating to semester URL: ${options.semesterUrl}`);
        await page.goto(options.semesterUrl, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForLoadState("networkidle").catch(() => undefined);

        // Try to extract term from page heading
        try {
          const heading = page.locator("h2, h3").first();
          const headingText = (await heading.textContent())?.trim() ?? "";
          const termMatch = headingText.match(
            /((?:Spring|Fall|Summer|Full Summer)[\sA-Za-z]*\d{4})/i,
          );
          if (termMatch) {
            termLabel = termMatch[1]!.trim();
          }
        } catch {
          // Will extract from individual reports
        }
      } else {
        // Navigate to the reports page — user must manually get to the report list.
        // The Bluera SPA requires several clicks to reach the actual report list
        // (reports page -> "All reports for students" -> semester -> report list).
        // The report list page (rpvlf.aspx) is server-rendered, not SPA.
        console.log("Navigating to Bluera reports page...");
        await page.goto(BLUERA_REPORTS_PAGE, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForLoadState("networkidle").catch(() => undefined);

        console.log("");
        console.log("=== Navigate to Report List ===");
        console.log("In the browser, please:");
        console.log('  1. Click the arrow/link next to "All reports for students"');
        console.log("  2. Select the semester you want to scrape (e.g. Fall 2025)");
        console.log("  3. Wait until you see the full list of individual TRACE reports");
        console.log('     (the page URL should contain "rpvlf.aspx")');
        console.log("");
        console.log("IMPORTANT: The report list opens in a NEW TAB.");
        console.log("Copy the URL from that tab and re-run with --semester-url:");
        console.log('  npx tsx scripts/scrape-trace-bluera-to-s3.ts --department CS --semester-url "<URL>"');
        console.log("");
        await promptForEnter(
          "Or press Enter if you've navigated to the report list in this browser tab...",
        );

        // Check if we ended up on a different page (user may have navigated)
        // If there are multiple tabs, try to find the report list
        const allPages = context.pages();
        let reportListPage = allPages.find((p) =>
          p.url().includes("rpvlf.aspx"),
        );
        if (reportListPage && reportListPage !== page) {
          const reportListUrl = reportListPage.url();
          console.log(`Found report list in another tab: ${reportListUrl}`);
          await page.goto(reportListUrl, {
            waitUntil: "domcontentloaded",
          });
          await page.waitForLoadState("networkidle").catch(() => undefined);
          await page.waitForTimeout(2000);
          // Close extra tabs
          for (const p of allPages) {
            if (p !== page) await p.close().catch(() => undefined);
          }
        }

        // Extract term from the page heading
        try {
          const heading = page.locator("h2, h3").first();
          const headingText = (await heading.textContent())?.trim() ?? "";
          const termMatch = headingText.match(
            /((?:Spring|Fall|Summer|Full Summer)[\sA-Za-z]*\d{4})/i,
          );
          if (termMatch) {
            termLabel = termMatch[1]!.trim();
          }
        } catch {
          // Will extract from individual reports
        }
      }

      console.log(
        termLabel
          ? `Detected term: ${termLabel}`
          : "Could not detect term from page; will extract from individual reports.",
      );

      console.log("Collecting report URLs from the list...");
      reportEntries = await collectReportUrlsFromList(page, options.filter, options.limit);

      if (reportEntries.length === 0) {
        throw new Error(
          "No report URLs were found from the current page.",
        );
      }

      // The search bar does a broad match. Apply a stricter code-level filter:
      // only keep reports where the course code (right after "for ") starts with --filter.
      if (options.filter) {
        const before = reportEntries.length;
        const filterUpper = options.filter.toUpperCase();
        reportEntries = reportEntries.filter((entry) => {
          const match = entry.title.match(/for\s+([A-Z]{2,6}\d{0,4})/i);
          if (!match) return false;
          return match[1]!.toUpperCase().startsWith(filterUpper);
        });
        console.log(
          `Filtered to ${reportEntries.length} reports where course code starts with "${options.filter}" (from ${before}).`,
        );
      }

      // Save collected URLs for future headless runs
      const toSave = reportEntries.map((entry) => ({
        ...entry,
        termLabel,
      }));
      await mkdir(path.dirname(SAVED_REPORT_URLS_PATH), { recursive: true });
      await writeFile(
        SAVED_REPORT_URLS_PATH,
        JSON.stringify(toSave, null, 2),
        "utf8",
      );
      console.log(
        `Saved ${toSave.length} report URLs for future headless runs.`,
      );
    }

    console.log(`Found ${reportEntries.length} report(s) to process.`);

    // Load existing manifest for resume support
    const existingManifestEntries = await readManifestEntries(
      options.manifestPath,
    );
    const processedReportUrls = !options.dryRun
      ? new Set(
          existingManifestEntries
            .filter((entry) => !entry.s3Key.startsWith("dry-run:"))
            .map((entry) => entry.reportUrl),
        )
      : new Set<string>();

    if (processedReportUrls.size > 0) {
      console.log(
        `Resume mode: ${processedReportUrls.size} report(s) already uploaded; they will be skipped.`,
      );
    }

    for (let idx = 0; idx < reportEntries.length; idx += 1) {
      const entry = reportEntries[idx]!;
      if (processedReportUrls.has(entry.url)) {
        continue;
      }

      const reportPage = await context.newPage();
      try {
        console.log(
          `[${idx + 1}/${reportEntries.length}] Processing: ${entry.title.slice(0, 80)}...`,
        );

        const metadata = await scrapeReportFromPage(
          reportPage,
          entry.url,
          termLabel,
        );

        // Parse department and course info from the report title
        const parsed = parseReportTitle(entry.title);
        const subject = parsed?.department ?? options.department;
        const courseCode =
          options.courseCode ?? parsed?.courseCode;
        const sectionStr = parsed?.section ?? "";

        // Generate PDF from the report page
        const pdfBuffer = await generatePdfFromPage(reportPage);

        const uploadKeyInput: TraceDocumentKey = {
          department: subject,
          semester: metadata.semester,
          lectureYear: metadata.lectureYear,
          professorId: metadata.sourceId,
        };
        if (courseCode !== undefined) {
          uploadKeyInput.courseCode = courseCode;
        }

        const dryRunParts = [
          uploadKeyInput.department,
          courseCode !== undefined ? String(courseCode) : "all-courses",
          `${uploadKeyInput.semester}_${uploadKeyInput.lectureYear}`,
          `${uploadKeyInput.professorId}.pdf`,
        ];

        const s3Key = options.dryRun
          ? `dry-run:${dryRunParts.join("/")}`
          : await repo!.uploadPdf(uploadKeyInput, pdfBuffer);

        const manifestEntry: TraceManifestEntry = {
          ...metadata,
          department: subject,
          s3Key,
          uploadedAt: new Date().toISOString(),
        };
        if (courseCode !== undefined) {
          manifestEntry.courseCode = courseCode;
        }
        // Store section info in courseId for reference
        if (sectionStr) {
          manifestEntry.courseId = sectionStr;
        }

        await appendManifest(options.manifestPath, manifestEntry);
        processedReportUrls.add(entry.url);

        console.log(
          `  Uploaded: ${metadata.termLabel} | ${metadata.instructor || "unknown"} -> ${s3Key}`,
        );
      } catch (err) {
        console.error(
          `  Error processing report ${idx + 1}: ${err instanceof Error ? err.message : String(err)}`,
        );
        // Continue to next report instead of stopping
      } finally {
        await reportPage.close();
      }
    }

    console.log(`Done. Manifest written to ${options.manifestPath}`);
  } finally {
    await context.close();
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
