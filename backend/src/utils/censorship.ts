export type CensorshipMode = "detect" | "censor" | "highlight" | "tag";

export interface CensorshipOptions {
  mode?: CensorshipMode;
  blockedTerms?: string[];
}

export interface CensorshipResult {
  originalText: string;
  processedText: string;
  containsBlockedContent: boolean;
  matchedTerms: string[];
  matchCount: number;
  mode: CensorshipMode;
}

export const defaultBlockedTerms: readonly string[] = Object.freeze([
  "damn",
  "hell",
  "shit",
  "fuck",
  "bitch",
  "crap",
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPattern(terms: readonly string[]): RegExp | null {
  const cleaned = terms
    .map((term) => term.trim())
    .filter((term) => term.length > 0);

  if (cleaned.length === 0) return null;
  const pattern = cleaned.map((term) => escapeRegExp(term)).join("|");
  return new RegExp(`\\b(${pattern})\\b`, "gi");
}

function redactWord(match: string): string {
  return "*".repeat(match.length);
}

function transformMatch(mode: CensorshipMode, match: string): string {
  if (mode === "censor") return redactWord(match);
  if (mode === "highlight") return `<<${match}>>`;
  if (mode === "tag") return `[FLAGGED:${match}]`;
  return match;
}

export function assessCensorship(text: string, options: CensorshipOptions = {}): CensorshipResult {
  const mode: CensorshipMode = options.mode ?? "censor";
  const terms = options.blockedTerms ?? defaultBlockedTerms;
  const pattern = buildPattern(terms);

  if (!pattern) {
    return {
      originalText: text,
      processedText: text,
      containsBlockedContent: false,
      matchedTerms: [],
      matchCount: 0,
      mode,
    };
  }

  const matches: string[] = [];
  const seen = new Set<string>();
  let matchCount = 0;

  const processedText = mode === "detect"
    ? text.replace(pattern, (match) => {
      matchCount += 1;
      const lowered = match.toLowerCase();
      if (!seen.has(lowered)) {
        matches.push(lowered);
        seen.add(lowered);
      }
      return match;
    })
    : text.replace(pattern, (match) => {
      matchCount += 1;
      const lowered = match.toLowerCase();
      if (!seen.has(lowered)) {
        matches.push(lowered);
        seen.add(lowered);
      }
      return transformMatch(mode, match);
    });

  return {
    originalText: text,
    processedText,
    containsBlockedContent: matches.length > 0,
    matchedTerms: matches,
    matchCount,
    mode,
  };
}
