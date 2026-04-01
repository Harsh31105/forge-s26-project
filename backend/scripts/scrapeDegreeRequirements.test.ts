import * as cheerio from "cheerio";
import {
    parseCourseCode,
    isChooseSection,
    buildSections,
} from "./scrapeDegreeRequirements";

describe("parseCourseCode", () => {
    test("parses a course code", () => {
        expect(parseCourseCode("CS 3000")).toEqual({ department: "CS", courseCode: 3000 });
    });

    test("parses a different department", () => {
        expect(parseCourseCode("CY 2550")).toEqual({ department: "CY", courseCode: 2550 });
    });

    test("parses a 5-digit course code", () => {
        expect(parseCourseCode("CS 10000")).toEqual({ department: "CS", courseCode: 10000 });
    });

    test("trims surrounding whitespace", () => {
        expect(parseCourseCode("  CS 3000  ")).toEqual({ department: "CS", courseCode: 3000 });
    });

    test("returns null for plain text", () => {
        expect(parseCourseCode("Algorithms and Data")).toBeNull();
    });

    test("returns null for an empty string", () => {
        expect(parseCourseCode("")).toBeNull();
    });

    test("returns null for a 3-digit code (too short)", () => {
        expect(parseCourseCode("CS 300")).toBeNull();
    });

    test("returns null for a 6-digit code (too long)", () => {
        expect(parseCourseCode("CS 100000")).toBeNull();
    });

    test("returns null when no department prefix", () => {
        expect(parseCourseCode("3000")).toBeNull();
    });
});

describe("isChooseSection", () => {
    test("returns true for 'Complete one of the following:'", () => {
        expect(isChooseSection("Complete one of the following:")).toBe(true);
    });

    test("returns true for 'Choose one of the following:'", () => {
        expect(isChooseSection("Choose one of the following:")).toBe(true);
    });

    test("returns true for 'Select one course from the following:'", () => {
        expect(isChooseSection("Select one course from the following:")).toBe(true);
    });

    test("returns true for 'Complete 1 of the following:'", () => {
        expect(isChooseSection("Complete 1 of the following:")).toBe(true);
    });

    test("returns true for 'Complete 2 of the following:'", () => {
        expect(isChooseSection("Complete 2 of the following:")).toBe(true);
    });

    test("returns true for section containing 'elective'", () => {
        expect(isChooseSection("Khoury Approved Electives")).toBe(true);
    });

    test("returns true for 'from the following' phrasing", () => {
        expect(isChooseSection("Choose one course from the following:")).toBe(true);
    });

    test("returns false for 'Complete all of the following:'", () => {
        expect(isChooseSection("Complete all of the following:")).toBe(false);
    });

    test("returns false for a required section name", () => {
        expect(isChooseSection("Computer Science Required Courses")).toBe(false);
    });

    test("returns false for 'Security Required Course'", () => {
        expect(isChooseSection("Security Required Course")).toBe(false);
    });

    test("returns true for 'Complete any two courses'", () => {
        expect(isChooseSection("Complete any two courses")).toBe(true);
    });

    test("returns true for 'Complete any one course'", () => {
        expect(isChooseSection("Complete any one course")).toBe(true);
    });
});

function sectionsFrom(html: string) {
    const $ = cheerio.load(html); // $ is now automatically typed
    const table = $("table.sc_courselist").get(0);

    if (!table) throw new Error("No course list table found");

    // @ts-ignore
    return { sections: buildSections($, table), $ };
}

describe("buildSections", () => {
    test("required section: isChoice is false", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">CS Required Courses</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 3000</a></td><td>Algorithms</td><td class="hourscol"></td></tr>
                <tr class="even"><td class="codecol"><a href="#">CS 3800</a></td><td>Theory</td><td class="hourscol"></td></tr>
            </table>
        `);
        expect(sections).toHaveLength(1);
        expect(sections[0]!.isChoice).toBe(false);
        expect(sections[0]!.rows).toHaveLength(2);
    });

    test("choice section from courselistcomment sub-header", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">Security Required Course</span></td><td class="hourscol"></td></tr>
                <tr class="even"><td colspan="2"><span class="courselistcomment">Complete one of the following:</span></td><td class="hourscol">4</td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CY 2550</a></td><td>Foundations of Cybersecurity</td><td class="hourscol"></td></tr>
                <tr class="even"><td class="codecol"><a href="#">CY 3740</a></td><td>Systems Security</td><td class="hourscol"></td></tr>
            </table>
        `);
        const choiceSection = sections.find(s => s.isChoice);
        expect(choiceSection).toBeDefined();
        expect(choiceSection!.rows).toHaveLength(2);
    });

    test("elective header detected as choice without sub-header", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">Khoury Approved Electives</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 4100</a></td><td>AI</td><td class="hourscol"></td></tr>
                <tr class="even"><td class="codecol"><a href="#">CS 4120</a></td><td>Compilers</td><td class="hourscol"></td></tr>
            </table>
        `);
        expect(sections[0]!.isChoice).toBe(true);
    });

    test("mixed section: required courses split from choice sub-section", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">CS Required Courses</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 3000</a></td><td>Algorithms</td><td class="hourscol"></td></tr>
                <tr class="even"><td colspan="2"><span class="courselistcomment">Complete one of the following:</span></td><td class="hourscol">4</td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 4530</a></td><td>Software Engineering</td><td class="hourscol"></td></tr>
                <tr class="even"><td class="codecol"><a href="#">CS 4535</a></td><td>Software Engineering Alt</td><td class="hourscol"></td></tr>
            </table>
        `);
        const required = sections.filter(s => !s.isChoice);
        const choice = sections.filter(s => s.isChoice);
        expect(required.length).toBeGreaterThanOrEqual(1);
        expect(choice.length).toBeGreaterThanOrEqual(1);
        expect(required.some(s => s.rows.length > 0)).toBe(true);
        expect(choice[0]!.rows).toHaveLength(2);
    });

    test("multiple areaheader sections are split correctly", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">Section A</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 1000</a></td><td>Intro</td><td class="hourscol"></td></tr>
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">Khoury Electives</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 4100</a></td><td>AI</td><td class="hourscol"></td></tr>
            </table>
        `);
        expect(sections).toHaveLength(2);
        expect(sections[0]!.isChoice).toBe(false);
        expect(sections[1]!.isChoice).toBe(true);
    });
});
import * as cheerio from "cheerio";
import {
    parseCourseCode,
    isChooseSection,
    buildSections,
} from "./scrapeDegreeRequirements";

describe("parseCourseCode", () => {
    test("parses a course code", () => {
        expect(parseCourseCode("CS 3000")).toEqual({ department: "CS", courseCode: 3000 });
    });

    test("parses a different department", () => {
        expect(parseCourseCode("CY 2550")).toEqual({ department: "CY", courseCode: 2550 });
    });

    test("parses a 5-digit course code", () => {
        expect(parseCourseCode("CS 10000")).toEqual({ department: "CS", courseCode: 10000 });
    });

    test("trims surrounding whitespace", () => {
        expect(parseCourseCode("  CS 3000  ")).toEqual({ department: "CS", courseCode: 3000 });
    });

    test("returns null for plain text", () => {
        expect(parseCourseCode("Algorithms and Data")).toBeNull();
    });

    test("returns null for an empty string", () => {
        expect(parseCourseCode("")).toBeNull();
    });

    test("returns null for a 3-digit code (too short)", () => {
        expect(parseCourseCode("CS 300")).toBeNull();
    });

    test("returns null for a 6-digit code (too long)", () => {
        expect(parseCourseCode("CS 100000")).toBeNull();
    });

    test("returns null when no department prefix", () => {
        expect(parseCourseCode("3000")).toBeNull();
    });
});

describe("isChooseSection", () => {
    test("returns true for 'Complete one of the following:'", () => {
        expect(isChooseSection("Complete one of the following:")).toBe(true);
    });

    test("returns true for 'Choose one of the following:'", () => {
        expect(isChooseSection("Choose one of the following:")).toBe(true);
    });

    test("returns true for 'Select one course from the following:'", () => {
        expect(isChooseSection("Select one course from the following:")).toBe(true);
    });

    test("returns true for 'Complete 1 of the following:'", () => {
        expect(isChooseSection("Complete 1 of the following:")).toBe(true);
    });

    test("returns true for 'Complete 2 of the following:'", () => {
        expect(isChooseSection("Complete 2 of the following:")).toBe(true);
    });

    test("returns true for section containing 'elective'", () => {
        expect(isChooseSection("Khoury Approved Electives")).toBe(true);
    });

    test("returns true for 'from the following' phrasing", () => {
        expect(isChooseSection("Choose one course from the following:")).toBe(true);
    });

    test("returns false for 'Complete all of the following:'", () => {
        expect(isChooseSection("Complete all of the following:")).toBe(false);
    });

    test("returns false for a required section name", () => {
        expect(isChooseSection("Computer Science Required Courses")).toBe(false);
    });

    test("returns false for 'Security Required Course'", () => {
        expect(isChooseSection("Security Required Course")).toBe(false);
    });

    test("returns true for 'Complete any two courses'", () => {
        expect(isChooseSection("Complete any two courses")).toBe(true);
    });

    test("returns true for 'Complete any one course'", () => {
        expect(isChooseSection("Complete any one course")).toBe(true);
    });

});

function sectionsFrom(html: string) {
    const $ = cheerio.load(html);
    const table = $("table.sc_courselist")[0]!;
    return { sections: buildSections($, table), $ };
}

describe("buildSections", () => {
    test("required section: isChoice is false", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">CS Required Courses</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 3000</a></td><td>Algorithms</td><td class="hourscol"></td></tr>
                <tr class="even"><td class="codecol"><a href="#">CS 3800</a></td><td>Theory</td><td class="hourscol"></td></tr>
            </table>
        `);
        expect(sections).toHaveLength(1);
        expect(sections[0]!.isChoice).toBe(false);
        expect(sections[0]!.rows).toHaveLength(2);
    });

    test("choice section from courselistcomment sub-header", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">Security Required Course</span></td><td class="hourscol"></td></tr>
                <tr class="even"><td colspan="2"><span class="courselistcomment">Complete one of the following:</span></td><td class="hourscol">4</td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CY 2550</a></td><td>Foundations of Cybersecurity</td><td class="hourscol"></td></tr>
                <tr class="even"><td class="codecol"><a href="#">CY 3740</a></td><td>Systems Security</td><td class="hourscol"></td></tr>
            </table>
        `);
        const choiceSection = sections.find(s => s.isChoice);
        expect(choiceSection).toBeDefined();
        expect(choiceSection!.rows).toHaveLength(2);
    });

    test("elective header detected as choice without sub-header", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">Khoury Approved Electives</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 4100</a></td><td>AI</td><td class="hourscol"></td></tr>
                <tr class="even"><td class="codecol"><a href="#">CS 4120</a></td><td>Compilers</td><td class="hourscol"></td></tr>
            </table>
        `);
        expect(sections[0]!.isChoice).toBe(true);
    });

    test("mixed section: required courses split from choice sub-section", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">CS Required Courses</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 3000</a></td><td>Algorithms</td><td class="hourscol"></td></tr>
                <tr class="even"><td colspan="2"><span class="courselistcomment">Complete one of the following:</span></td><td class="hourscol">4</td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 4530</a></td><td>Software Engineering</td><td class="hourscol"></td></tr>
                <tr class="even"><td class="codecol"><a href="#">CS 4535</a></td><td>Software Engineering Alt</td><td class="hourscol"></td></tr>
            </table>
        `);
        const required = sections.filter(s => !s.isChoice);
        const choice = sections.filter(s => s.isChoice);
        expect(required.length).toBeGreaterThanOrEqual(1);
        expect(choice.length).toBeGreaterThanOrEqual(1);
        expect(required.some(s => s.rows.length > 0)).toBe(true);
        expect(choice[0]!.rows).toHaveLength(2);
    });

    test("multiple areaheader sections are split correctly", () => {
        const { sections } = sectionsFrom(`
            <table class="sc_courselist">
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">Section A</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 1000</a></td><td>Intro</td><td class="hourscol"></td></tr>
                <tr class="areaheader"><td colspan="2"><span class="courselistcomment areaheader">Khoury Electives</span></td><td class="hourscol"></td></tr>
                <tr class="odd"><td class="codecol"><a href="#">CS 4100</a></td><td>AI</td><td class="hourscol"></td></tr>
            </table>
        `);
        expect(sections).toHaveLength(2);
        expect(sections[0]!.isChoice).toBe(false);
        expect(sections[1]!.isChoice).toBe(true);
    });
});
