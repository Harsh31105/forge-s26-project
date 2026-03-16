/**
 * TRACE scrape-to-S3 helper.
 *
 * Default flow:
 * 1. Launch a browser with a persistent profile.
 * 2. Log into TRACE and filter/search the report browser manually.
 * 3. Press Enter in the terminal.
 * 4. The script collects visible "View" report links (and paginates with Next).
 * 5. It opens each report, extracts the "View as PDF" URL, downloads the PDF,
 *    uploads it to S3, and appends a manifest entry with the resulting S3 key.
 *
 * Example:
 *   npx ts-node scripts/scrape-trace-to-s3.ts --department CS --course-code 3000 --limit 3
 *
 * Single-report example:
 *   npx ts-node scripts/scrape-trace-to-s3.ts \
 *     --department CS \
 *     --course-code 3000 \
 *     --report-url "https://www.applyweb.com/eval/new/coursereport?sp=105548&sp=4112&sp=198"
 */
import "dotenv/config";

import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import process from "process";
import { createInterface } from "readline/promises";

import { chromium, type BrowserContext, type Frame, type Page } from "playwright";

import { s3Config } from "../src/config/s3";
import { TraceDocumentRepositoryS3, type TraceDocumentKey } from "../src/storage/s3/traceDocuments";

const DEFAULT_REPORT_BROWSER_URL = "https://www.applyweb.com/eval/new/reportbrowser";
const DEFAULT_USER_DATA_DIR = path.resolve(process.cwd(), ".trace-playwright");
const DEFAULT_MANIFEST_PATH = path.resolve(process.cwd(), "scripts/output/trace-scrape-manifest.json");

interface CliOptions {
    department: string;
    courseCode?: number;
    reportUrl?: string;
    reportBrowserUrl: string;
    limit?: number;
    headless: boolean;
    userDataDir: string;
    manifestPath: string;
    allowExcluded2025: boolean;
    dryRun: boolean;
}

interface TraceCredentials {
    username: string;
    password: string;
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
  npx ts-node scripts/scrape-trace-to-s3.ts --department CS [--course-code 3000] [options]

Required:
  --department <value>    Department prefix used for the S3 path (e.g. CS)

Optional:
  --course-code <value>         Course code for S3 path (e.g. 3000). Omit to scrape entire department.
  --report-url <url>            Process one report page directly
  --report-browser-url <url>    Override the TRACE browser URL
  --limit <n>                   Stop after n reports
  --user-data-dir <path>        Persistent Playwright profile location
  --manifest-path <path>        JSON manifest output path
  --headless                    Run browser headless
  --allow-excluded-2025         Include Summer/Fall 2025 reports
  --dry-run                     Skip S3 upload and only print the would-be key
  --help                        Show this help text

Environment:
  AWS_ACCESS_KEY_ID
  AWS_SECRET_ACCESS_KEY
  AWS_REGION
  S3_BUCKET_NAME
  TRACE_USERNAME
  TRACE_PASSWORD
  TRACE_USERNAME_SELECTOR       Optional override for the username input selector
  TRACE_PASSWORD_SELECTOR       Optional override for the password input selector
  TRACE_SUBMIT_SELECTOR         Optional override for the submit button selector
`);
}

function parseArgs(argv: string[]): Map<string, string | boolean> {
    const args = new Map<string, string | boolean>();

    for (let idx = 0; idx < argv.length; idx += 1) {
        const token = argv[idx];
        if (!token?.startsWith("--")) continue;

        const key = token.slice(2);
        const next = argv[idx + 1];
        if (!next || next.startsWith("--")) {
            args.set(key, true);
            continue;
        }

        args.set(key, next);
        idx += 1;
    }

    return args;
}

function getStringArg(args: Map<string, string | boolean>, key: string): string | undefined {
    const value = args.get(key);
    return typeof value === "string" ? value : undefined;
}

function getBooleanArg(args: Map<string, string | boolean>, key: string): boolean {
    return args.get(key) === true;
}

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

    if (normalized.startsWith("spring")) return "spring";
    if (normalized.startsWith("summer 1")) return "summer_1";
    if (normalized.startsWith("summer 2")) return "summer_2";
    if (normalized.startsWith("summer")) return "summer";
    if (normalized.startsWith("fall")) return "fall";

    return slugify(termLabel).replace(/-/g, "_");
}

function extractLectureYear(termLabel: string): number {
    const match = termLabel.match(/\b(20\d{2})\b/);
    if (!match) {
        throw new Error(`Could not parse lecture year from term label: "${termLabel}"`);
    }

    return Number(match[1]);
}

function buildSourceId(reportUrl: string, instructor: string, section: string, courseId: string): string {
    const url = new URL(reportUrl);
    const spParts = url.searchParams.getAll("sp");
    const cPart = url.searchParams.get("c");
    const hash = createHash("sha1").update(reportUrl).digest("hex").slice(0, 10);

    return [
        slugify(instructor) || "instructor",
        section ? `section-${slugify(section)}` : "",
        courseId ? `course-${slugify(courseId)}` : "",
        spParts.length > 0 ? `sp-${spParts.join("-")}` : "",
        cPart ? `c-${slugify(cPart)}` : "",
        hash,
    ]
        .filter((part) => part.length > 0)
        .join("-")
        .slice(0, 180);
}

function looksLikePdf(buffer: Buffer): boolean {
    return buffer.subarray(0, 4).toString("utf8") === "%PDF";
}

const MIN_YEAR = 2021;
const MIN_SEMESTER = "spring";

function semesterOrder(sem: string): number {
    if (sem.startsWith("spring")) return 1;
    if (sem.startsWith("summer")) return 2;
    if (sem.startsWith("fall")) return 3;
    return 0;
}

function shouldSkipTerm(semester: string, year: number, allowExcluded2025: boolean): "too-old" | "excluded" | false {
    if (year < MIN_YEAR) return "too-old";
    if (year === MIN_YEAR && semesterOrder(semester) < semesterOrder(MIN_SEMESTER)) return "too-old";

    if (!allowExcluded2025 && year === 2025 && (semester === "fall" || semester.startsWith("summer"))) return "excluded";
    return false;
}

function requireEnv(name: string): void {
    if (!process.env[name]) {
        throw new Error(`Missing required environment variable: ${name}`);
    }
}

function getTraceCredentials(): TraceCredentials | undefined {
    const username = process.env.TRACE_USERNAME?.trim();
    const password = process.env.TRACE_PASSWORD;

    if (!username || !password) return undefined;
    return { username, password };
}

async function findFirstVisibleLocator(page: Page, selectors: string[]): Promise<ReturnType<Page["locator"]> | null> {
    for (const selector of selectors) {
        const locator = page.locator(selector).first();
        if (await locator.isVisible().catch(() => false)) {
            return locator;
        }
    }

    return null;
}

async function maybeAutoLogin(page: Page, credentials: TraceCredentials | undefined): Promise<boolean> {
    const passwordSelectors = [
        process.env.TRACE_PASSWORD_SELECTOR,
        "input[type='password']",
        "input[name='password']",
        "input[id='password']",
    ].filter((value): value is string => Boolean(value));

    const passwordInput = await findFirstVisibleLocator(page, passwordSelectors);
    if (!passwordInput) return false;
    if (!credentials) {
        throw new Error("TRACE login page detected but TRACE_USERNAME / TRACE_PASSWORD are not set.");
    }

    const usernameSelectors = [
        process.env.TRACE_USERNAME_SELECTOR,
        "input[type='email']",
        "input[name='username']",
        "input[id='username']",
        "input[name='user']",
        "input[id='user']",
        "input[name='login']",
        "input[id='login']",
        "input[type='text']",
    ].filter((value): value is string => Boolean(value));

    const submitSelectors = [
        process.env.TRACE_SUBMIT_SELECTOR,
        "button[type='submit']",
        "input[type='submit']",
        "button:has-text('Sign in')",
        "button:has-text('Log in')",
        "button:has-text('Login')",
        "button:has-text('Continue')",
        "text=Sign in",
        "text=Log in",
        "text=Login",
    ].filter((value): value is string => Boolean(value));

    const usernameInput = await findFirstVisibleLocator(page, usernameSelectors);
    if (!usernameInput) {
        throw new Error("TRACE login page detected but no username input could be found.");
    }

    await usernameInput.fill(credentials.username);
    await passwordInput.fill(credentials.password);

    const submitButton = await findFirstVisibleLocator(page, submitSelectors);
    if (!submitButton) {
        await passwordInput.press("Enter");
    } else {
        await submitButton.click();
    }

    await page.waitForLoadState("domcontentloaded");
    await page.waitForLoadState("networkidle").catch(() => undefined);
    return true;
}

async function isLoggedOutPage(page: Page): Promise<boolean> {
    const bodyText = await page.locator("body").innerText().catch(() => "");
    return /logged out|may close your browser/i.test(bodyText);
}

async function ensureTraceSession(page: Page, credentials: TraceCredentials | undefined): Promise<void> {
    const traceHome = process.env.TRACE_LOGIN_URL ?? "https://www.applyweb.com/eval/shibboleth/neu/36892";
    console.log(`Opening TRACE login entry point: ${traceHome}`);
    await page.goto(traceHome, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);

    for (let attempts = 0; attempts < 5; attempts += 1) {
        const loggedIn = await maybeAutoLogin(page, credentials);
        if (!loggedIn) break;
        console.log(`Submitted login form (attempt ${attempts + 1}). Now at: ${page.url()}`);
    }

    const isOnTrace = page.url().includes("applyweb.com/eval") && !(await isLoggedOutPage(page));
    if (!isOnTrace) {
        console.log("");
        console.log("=== Manual Login Required ===");
        console.log("In the browser that opened, please:");
        console.log("  1. Log in through your university SSO (Northeastern, etc.)");
        console.log("  2. Make sure you can see the TRACE dashboard / reports page");
        console.log("");
        console.log("If the browser is showing a blank or logout page, navigate to your");
        console.log("university's TRACE link manually in the browser's address bar.");
        console.log("(e.g. search 'Northeastern TRACE evaluations' and log in from there)");
        console.log("");
        await promptForEnter("Press Enter here once you are logged into TRACE...");

        if (await isLoggedOutPage(page)) {
            await page.goto(DEFAULT_REPORT_BROWSER_URL, { waitUntil: "domcontentloaded" });
            await page.waitForLoadState("networkidle").catch(() => undefined);
        }
    }

    if (await isLoggedOutPage(page)) {
        throw new Error(
            "Still not logged into TRACE after manual login.\n" +
            `Current URL: ${page.url()}\n` +
            "Make sure you complete the full SSO login in the browser before pressing Enter."
        );
    }

    console.log(`TRACE session established. Current URL: ${page.url()}`);
}

async function gotoWithOptionalLogin(page: Page, targetUrl: string, credentials: TraceCredentials | undefined): Promise<void> {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);

    for (let attempts = 0; attempts < 3; attempts += 1) {
        const loggedIn = await maybeAutoLogin(page, credentials);
        if (!loggedIn) break;
    }

    if (await isLoggedOutPage(page)) {
        console.log("Detected TRACE logout/unauthenticated page. Need to log in first...");
        await ensureTraceSession(page, credentials);
        console.log("Session established. Navigating back to target page...");
        await page.goto(targetUrl, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => undefined);
    }
}

function parseOptions(argv: string[]): CliOptions {
    const args = parseArgs(argv);

    if (getBooleanArg(args, "help")) {
        printUsage();
        process.exit(0);
    }

    const department = getStringArg(args, "department");
    const courseCodeValue = getStringArg(args, "course-code");

    if (!department) {
        printUsage();
        throw new Error("--department is required.");
    }

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

    const reportUrl = getStringArg(args, "report-url");
    const options: CliOptions = {
        department: department.trim().toUpperCase(),
        reportBrowserUrl: getStringArg(args, "report-browser-url") ?? DEFAULT_REPORT_BROWSER_URL,
        headless: getBooleanArg(args, "headless"),
        userDataDir: path.resolve(getStringArg(args, "user-data-dir") ?? DEFAULT_USER_DATA_DIR),
        manifestPath: path.resolve(getStringArg(args, "manifest-path") ?? DEFAULT_MANIFEST_PATH),
        allowExcluded2025: getBooleanArg(args, "allow-excluded-2025"),
        dryRun: getBooleanArg(args, "dry-run"),
    };

    if (courseCode !== undefined) {
        options.courseCode = courseCode;
    }

    if (reportUrl) {
        options.reportUrl = reportUrl;
    }
    if (limit !== undefined) {
        options.limit = limit;
    }

    return options;
}

async function promptForEnter(message: string): Promise<void> {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    await rl.question(message);
    rl.close();
}

type ReportContext = Page | Frame;

async function getBodyText(context: ReportContext): Promise<string> {
    return context.locator("body").innerText();
}

async function resolveReportContext(page: Page): Promise<ReportContext> {
    const directPdfLink = page.locator("a:has-text('View as PDF')").first();
    if (await directPdfLink.isVisible().catch(() => false)) {
        return page;
    }

    const embeddedReportFrame = page.locator("iframe[src*='/eval/new/showreport']").first();
    const embeddedSrc = await embeddedReportFrame.getAttribute("src").catch(() => null);
    if (embeddedSrc) {
        const embeddedUrl = new URL(embeddedSrc, page.url()).toString();
        await page.goto(embeddedUrl, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => undefined);

        if (await directPdfLink.isVisible().catch(() => false)) {
            return page;
        }
    }

    const html = await page.content();
    const showReportMatch = html.match(/(?:src|href)=["']([^"']*\/eval\/new\/showreport\?[^"']+)["']/i);
    if (showReportMatch?.[1]) {
        const embeddedUrl = new URL(showReportMatch[1], page.url()).toString();
        await page.goto(embeddedUrl, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle").catch(() => undefined);

        if (await directPdfLink.isVisible().catch(() => false)) {
            return page;
        }
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
        const showReportFrame = page
            .frames()
            .find((frame) => frame.url().includes("/eval/new/showreport"));

        if (showReportFrame) {
            const framePdfLink = showReportFrame.locator("a:has-text('View as PDF')").first();
            if (await framePdfLink.isVisible().catch(() => false)) {
                return showReportFrame;
            }
        }

        await page.waitForTimeout(500);
    }

    const frameUrls = page.frames().map((frame) => frame.url()).filter((url) => url.length > 0);
    const iframeSrcs = await page
        .locator("iframe")
        .evaluateAll((elements) =>
            elements
                .map((element) => (element as HTMLIFrameElement).getAttribute("src") ?? "")
                .filter((src) => src.length > 0)
        )
        .catch(() => []);

    const debugHtml = await page.content().catch(() => "(could not read page content)");
    const debugPath = path.join(process.cwd(), "trace-debug-page.html");
    await writeFile(debugPath, debugHtml, "utf8").catch(() => undefined);
    console.error(`DEBUG: Dumped page HTML (${debugHtml.length} chars) to ${debugPath}`);
    console.error(`DEBUG: Page title: ${await page.title().catch(() => "unknown")}`);
    console.error(`DEBUG: Page URL: ${page.url()}`);

    throw new Error(
        `Could not find "View as PDF" in the top page or TRACE iframe for ${page.url()}.\nFrames seen:\n${frameUrls.join("\n")}\niframe src values seen:\n${iframeSrcs.join("\n")}`
    );
}

function extractField(bodyText: string, label: string): string {
    const match = bodyText.match(new RegExp(`${label}:\\s*(.+)`));
    return match?.[1]?.trim() ?? "";
}

async function resolvePdfHref(context: ReportContext, reportUrl: string): Promise<string> {
    const locatorHref = await context.locator("a:has-text('View as PDF')").first().getAttribute("href").catch(() => null);
    if (locatorHref) return locatorHref;

    const html = await context.content();
    const pdfMatch = html.match(/href=["']([^"']*\/eval\/new\/showreport\/pdf\?[^"']+)["']/i);
    if (pdfMatch?.[1]) {
        return pdfMatch[1];
    }

    throw new Error(`Could not find "View as PDF" link on ${reportUrl}`);
}

async function scrapeReportMetadataFromCurrentPage(page: Page, reportUrl: string): Promise<ScrapedReportMetadata> {
    const reportContext = await resolveReportContext(page);
    return extractMetadataFromContext(reportContext, reportUrl);
}

async function scrapeReportMetadata(page: Page, reportUrl: string): Promise<ScrapedReportMetadata> {
    await page.goto(reportUrl, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => undefined);

    const reportContext = await resolveReportContext(page);
    return extractMetadataFromContext(reportContext, reportUrl);
}

async function extractMetadataFromContext(reportContext: ReportContext, reportUrl: string): Promise<ScrapedReportMetadata> {
    const pdfHref = await resolvePdfHref(reportContext, reportUrl);

    const bodyText = await getBodyText(reportContext);
    const headingText = (await reportContext.locator("h3").first().textContent())?.trim() ?? "";
    const termMatch = headingText.match(/\(([^)]+)\)/);
    const termLabel = termMatch?.[1]?.trim() ?? "";
    if (!termLabel) {
        throw new Error(`Could not parse term label from report heading: "${headingText}"`);
    }

    const semester = normalizeSemester(termLabel);
    const lectureYear = extractLectureYear(termLabel);
    const instructor = extractField(bodyText, "Instructor");
    const section = extractField(bodyText, "Section");
    const courseId = extractField(bodyText, "Course ID");
    const courseTitle = extractField(bodyText, "Course Title");

    return {
        reportUrl,
        pdfUrl: new URL(pdfHref, reportUrl).toString(),
        courseTitle,
        instructor,
        section,
        courseId,
        termLabel,
        semester,
        lectureYear,
        sourceId: buildSourceId(reportUrl, instructor, section, courseId),
    };
}

async function collectReportUrlsFromBrowser(page: Page, limit?: number): Promise<string[]> {
    const urls = new Set<string>();

    while (true) {
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);

        const iframeLocator = page.frameLocator("#contentFrame");

        let hrefs: string[] = [];

        try {
            hrefs = await iframeLocator
                .locator("a")
                .evaluateAll((elements) =>
                    elements
                        .filter((element) => {
                            const text = element.textContent?.trim().toLowerCase() ?? "";
                            const href = (element as HTMLAnchorElement).href ?? "";
                            return text === "view" || href.includes("coursereport");
                        })
                        .map((element) => (element as HTMLAnchorElement).href)
                        .filter((href) => href.length > 0)
                );
            console.log(`Found ${hrefs.length} report link(s) in iframe on current page.`);
        } catch {
            console.log("DEBUG: Could not access #contentFrame iframe, trying top page...");
            hrefs = await page
                .locator("a")
                .evaluateAll((elements) =>
                    elements
                        .filter((element) => {
                            const text = element.textContent?.trim().toLowerCase() ?? "";
                            const href = (element as HTMLAnchorElement).href ?? "";
                            return text === "view" || href.includes("coursereport");
                        })
                        .map((element) => (element as HTMLAnchorElement).href)
                        .filter((href) => href.length > 0)
                );
            console.log(`Found ${hrefs.length} report link(s) on top page.`);
        }

        hrefs.forEach((href) => {
            if (!limit || urls.size < limit) {
                urls.add(href);
            }
        });

        if (limit && urls.size >= limit) break;

        let hasOldTerms = false;
        try {
            const termTexts = await (iframeLocator ?? page)
                .locator("td")
                .evaluateAll((cells) =>
                    cells.map((c) => c.textContent?.trim() ?? "").filter((t) => /\b(19|20)\d{2}\b/.test(t))
                );

            hasOldTerms = termTexts.some((t) => {
                const yearMatch = t.match(/\b(20\d{2})\b/);
                return yearMatch && Number(yearMatch[1]) < MIN_YEAR;
            });
        } catch { /* ignore */ }

        if (hasOldTerms) {
            console.log(`Detected pre-${MIN_YEAR} terms on current page. Stopping URL collection.`);
            break;
        }

        let nextLink = iframeLocator.locator("a:has-text('Next')").first();
        let nextVisible = await nextLink.isVisible().catch(() => false);
        if (!nextVisible) {
            nextLink = page.locator("a:has-text('Next')").first();
            nextVisible = await nextLink.isVisible().catch(() => false);
        }
        if (!nextVisible) break;

        const previousUrls = new Set(urls);
        await nextLink.click();
        await page.waitForLoadState("networkidle").catch(() => undefined);
        await page.waitForTimeout(2000);

        // Guard against pagination loops where "Next" is visible but data does not advance.
        const advancedHrefs = await iframeLocator
            .locator("a")
            .evaluateAll((elements) =>
                elements
                    .filter((element) => {
                        const text = element.textContent?.trim().toLowerCase() ?? "";
                        const href = (element as HTMLAnchorElement).href ?? "";
                        return text === "view" || href.includes("coursereport");
                    })
                    .map((element) => (element as HTMLAnchorElement).href)
                    .filter((href) => href.length > 0)
            )
            .catch(() => []);

        const advanced = advancedHrefs.some((href) => !previousUrls.has(href));
        if (!advanced) {
            console.log("No new report links after clicking Next; stopping URL collection.");
            break;
        }
    }

    return [...urls];
}

async function downloadPdf(context: BrowserContext, pdfUrl: string): Promise<Buffer> {
    const response = await context.request.get(pdfUrl);
    if (!response.ok()) {
        throw new Error(`Failed to download PDF (${response.status()} ${response.statusText()}) from ${pdfUrl}`);
    }

    const buffer = Buffer.from(await response.body());
    const contentType = response.headers()["content-type"] ?? "";
    if (!contentType.includes("application/pdf") && !looksLikePdf(buffer)) {
        throw new Error(`Response from ${pdfUrl} was not a PDF (content-type: ${contentType || "unknown"})`);
    }

    return buffer;
}

async function appendManifest(manifestPath: string, entry: TraceManifestEntry): Promise<void> {
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
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

async function main(): Promise<void> {
    const options = parseOptions(process.argv.slice(2));
    const traceCredentials = getTraceCredentials();

    if (!options.dryRun) {
        requireEnv("AWS_ACCESS_KEY_ID");
        requireEnv("AWS_SECRET_ACCESS_KEY");
        requireEnv("AWS_REGION");
        requireEnv("S3_BUCKET_NAME");
    }

    const repo = options.dryRun ? undefined : new TraceDocumentRepositoryS3(s3Config);
    const context = await chromium.launchPersistentContext(options.userDataDir, {
        headless: options.headless,
    });

    try {
        const page = context.pages()[0] ?? await context.newPage();
        let reportUrls: string[] = [];

        if (options.reportUrl) {
            await gotoWithOptionalLogin(page, options.reportUrl, traceCredentials);
            console.log(`Opened report URL: ${options.reportUrl}`);
            if (!traceCredentials) {
                console.log("If TRACE redirects you to log in, complete login in the opened browser.");
                await promptForEnter("Press Enter once the desired report page is visible in the browser...");
            }

            reportUrls = [page.url()];
        } else {
            await gotoWithOptionalLogin(page, options.reportBrowserUrl, traceCredentials);
            console.log(`Opened TRACE report browser at ${options.reportBrowserUrl}`);
            if (traceCredentials) {
                console.log("TRACE credentials detected. Apply your desired filters/search in the opened browser.");
            } else {
                console.log("Log in and apply your desired filters/search in the opened browser.");
            }
            await promptForEnter("Press Enter here once the visible results are ready to scrape...");

            reportUrls = await collectReportUrlsFromBrowser(page, options.limit);
            if (reportUrls.length === 0) {
                throw new Error("No report URLs were found from the current TRACE results page.");
            }
        }

        console.log(`Found ${reportUrls.length} report URL(s) to process.`);

        for (let idx = 0; idx < reportUrls.length; idx += 1) {
            const reportUrl = reportUrls[idx]!;
            const isFirstSingleReport = options.reportUrl && idx === 0;
            const reportPage = isFirstSingleReport ? page : await context.newPage();
            try {
                const metadata = isFirstSingleReport
                    ? await scrapeReportMetadataFromCurrentPage(reportPage, reportUrl)
                    : await scrapeReportMetadata(reportPage, reportUrl);

                const skipReason = shouldSkipTerm(metadata.semester, metadata.lectureYear, options.allowExcluded2025);
                if (skipReason === "too-old") {
                    console.log(`Reached pre-${MIN_YEAR} report (${metadata.termLabel}). Stopping.`);
                    break;
                }
                if (skipReason === "excluded") {
                    console.log(`Skipping excluded term ${metadata.termLabel}: ${reportUrl}`);
                    continue;
                }

                const pdfBuffer = await downloadPdf(context, metadata.pdfUrl);
                const uploadKeyInput: TraceDocumentKey = {
                    department: options.department,
                    semester: metadata.semester,
                    lectureYear: metadata.lectureYear,
                    professorId: metadata.sourceId,
                };
                if (options.courseCode !== undefined) {
                    uploadKeyInput.courseCode = options.courseCode;
                }

                const dryRunParts = [uploadKeyInput.department, uploadKeyInput.courseCode !== undefined ? String(uploadKeyInput.courseCode) : "all-courses"];
                dryRunParts.push(`${uploadKeyInput.semester}_${uploadKeyInput.lectureYear}`, `${uploadKeyInput.professorId}.pdf`);

                const s3Key = options.dryRun
                    ? `dry-run:${dryRunParts.join("/")}`
                    : await repo!.uploadPdf(uploadKeyInput, pdfBuffer);

                const manifestEntry: TraceManifestEntry = {
                    ...metadata,
                    department: options.department,
                    s3Key,
                    uploadedAt: new Date().toISOString(),
                };
                if (options.courseCode !== undefined) {
                    manifestEntry.courseCode = options.courseCode;
                }

                await appendManifest(options.manifestPath, manifestEntry);
                console.log(`Uploaded ${metadata.termLabel} report for ${metadata.instructor || "unknown instructor"} -> ${s3Key}`);
            } finally {
                if (!isFirstSingleReport) {
                    await reportPage.close();
                }
            }
        }

        console.log(`Done. Manifest written to ${options.manifestPath}`);
    } finally {
        await context.close();
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
