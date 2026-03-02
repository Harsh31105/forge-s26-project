import { assessCensorship } from "./censorship";

describe("assessCensorship", () => {
  test("detect mode flags blocked terms without changing text", () => {
    const result = assessCensorship("This is damn bad", { mode: "detect" });

    expect(result.processedText).toBe("This is damn bad");
    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matchedTerms).toEqual(["damn"]);
  });

  test("censor mode masks each blocked term with stars", () => {
    const result = assessCensorship("damn this shit is bad", { mode: "censor" });

    expect(result.processedText).toBe("**** this **** is bad");
    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchCount).toBe(2);
    expect(result.matchedTerms).toEqual(["damn", "shit"]);
  });

  test("highlight mode wraps blocked terms", () => {
    const result = assessCensorship("what the hell", { mode: "highlight" });

    expect(result.processedText).toBe("what the <<hell>>");
    expect(result.matchCount).toBe(1);
    expect(result.matchedTerms).toEqual(["hell"]);
  });

  test("does not match blocked terms inside larger words", () => {
    const result = assessCensorship("shell and hello should pass", { mode: "censor" });

    expect(result.processedText).toBe("shell and hello should pass");
    expect(result.containsBlockedContent).toBe(false);
    expect(result.matchCount).toBe(0);
    expect(result.matchedTerms).toEqual([]);
  });

  test("respects custom blocked terms list", () => {
    const result = assessCensorship("alpha beta gamma", {
      mode: "tag",
      blockedTerms: ["beta"],
    });

    expect(result.processedText).toBe("alpha [FLAGGED:beta] gamma");
    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matchedTerms).toEqual(["beta"]);
  });
});
