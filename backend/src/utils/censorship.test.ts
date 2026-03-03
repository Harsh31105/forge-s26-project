import { assessCensorship } from "./censorship";

describe("assessCensorship", () => {
  test("masks each blocked term with stars", () => {
    const result = assessCensorship("damn this shit is bad");

    expect(result.processedText).toBe("**** this **** is bad");
    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchCount).toBe(2);
    expect(result.matchedTerms).toEqual(expect.arrayContaining(["damn", "shit"]));
  });

  test("detects unicode/diacritic obfuscation", () => {
    const result = assessCensorship("This is shït");

    expect(result.processedText).toBe("This is ****");
    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matchedTerms).toEqual(["shit"]);
  });

  test("detects spacing/symbol obfuscation", () => {
    const result = assessCensorship("s h ! t is censored");

    expect(result.processedText).toBe("******* is censored");
    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matchedTerms).toEqual(["shit"]);
  });

  test("detects partial forms like suffix variations", () => {
    const result = assessCensorship("This is fucking wild");

    expect(result.processedText).toBe("This is ******* wild");
    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matchedTerms).toEqual(expect.arrayContaining(["fuck"]));
  });

  test("respects custom blocked terms list", () => {
    const result = assessCensorship("alpha beta gamma", {
      blockedTerms: ["beta"],
    });

    expect(result.processedText).toBe("alpha **** gamma");
    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchCount).toBe(1);
    expect(result.matchedTerms).toEqual(["beta"]);
  });

  test("clean text returns unchanged", () => {
    const result = assessCensorship("This is a perfectly fine sentence");

    expect(result.processedText).toBe("This is a perfectly fine sentence");
    expect(result.containsBlockedContent).toBe(false);
    expect(result.matchCount).toBe(0);
    expect(result.matchedTerms).toEqual([]);
  });

  test("empty string returns unchanged", () => {
    const result = assessCensorship("");

    expect(result.processedText).toBe("");
    expect(result.containsBlockedContent).toBe(false);
    expect(result.matchCount).toBe(0);
  });

  test("does not match blocked terms inside larger words", () => {
    const result = assessCensorship("shell and hello should pass");

    expect(result.processedText).toBe("shell and hello should pass");
    expect(result.containsBlockedContent).toBe(false);
    expect(result.matchCount).toBe(0);
  });

  test("detects leetspeak substitutions", () => {
    const result = assessCensorship("that is $h1t");

    expect(result.containsBlockedContent).toBe(true);
    expect(result.matchedTerms).toEqual(expect.arrayContaining(["shit"]));
  });

  test("empty blocked terms list returns text unchanged", () => {
    const result = assessCensorship("damn this", { blockedTerms: [] });

    expect(result.processedText).toBe("damn this");
    expect(result.containsBlockedContent).toBe(false);
    expect(result.matchCount).toBe(0);
  });
});
