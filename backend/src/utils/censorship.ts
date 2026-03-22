import leoProfanity = require("leo-profanity");

export interface CensorshipOptions {
  blockedTerms?: readonly string[];
}

export interface CensorshipResult {
  originalText: string;
  processedText: string;
  containsBlockedContent: boolean;
  matchedTerms: string[];
  matchCount: number;
}

leoProfanity.loadDictionary("en");
leoProfanity.add(["damn", "hell", "crap"]);

export const defaultBlockedTerms: readonly string[] = Object.freeze([
  ...leoProfanity.list(),
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ALNUM = /[a-z0-9]/;
const COMBINING_MARKS = /\p{M}/gu;
const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

function normalizeChar(value: string): string {
  const folded = value.normalize("NFKD").replace(COMBINING_MARKS, "").toLowerCase();
  return [...folded]
      .map((char) => LEET_MAP[char] ?? char)
      .join("");
}

function buildNormalizedText(input: string): { text: string; map: number[] } {
  const chars: string[] = [];
  const map: number[] = [];

  for (let idx = 0; idx < input.length; idx += 1) {
    const normalized = normalizeChar(input[idx] ?? "");
    if (!normalized) continue;

    for (const char of normalized) {
      chars.push(ALNUM.test(char) ? char : " ");
      map.push(idx);
    }
  }

  return { text: chars.join(""), map };
}

function sanitizeTerms(terms: readonly string[]): string[] {
  return terms
      .map((term) => normalizeChar(term).replace(/[^a-z0-9]/g, ""))
      .filter((term) => term.length > 0);
}

function termPattern(term: string): RegExp {
  const letters = [...term].map((char) => escapeRegExp(char)).join("[^a-z0-9]*");
  // Optional suffixes catch partial forms like "fucking", "fucked", "damns".
  const suffix = "(?:ing|ed|er|ers|s)?";
  return new RegExp(`(^|[^a-z0-9])(${letters}${suffix})(?=$|[^a-z0-9])`, "g");
}

function censorRanges(text: string, ranges: Array<{ start: number; end: number }>): string {
  if (ranges.length === 0) return text;

  let cursor = 0;
  let output = "";
  for (const range of ranges) {
    output += text.slice(cursor, range.start);
    output += "*".repeat(range.end - range.start);
    cursor = range.end;
  }
  output += text.slice(cursor);
  return output;
}

export function assessCensorship(text: string, options: CensorshipOptions = {}): CensorshipResult {
  const rawTerms = options.blockedTerms ?? defaultBlockedTerms;
  const terms = sanitizeTerms(rawTerms);
  if (terms.length === 0) {
    return {
      originalText: text,
      processedText: text,
      containsBlockedContent: false,
      matchedTerms: [],
      matchCount: 0,
    };
  }

  const { text: normalized, map } = buildNormalizedText(text);
  if (normalized.length === 0 || map.length === 0) {
    return {
      originalText: text,
      processedText: text,
      containsBlockedContent: false,
      matchedTerms: [],
      matchCount: 0,
    };
  }

  const ranges: Array<{ start: number; end: number }> = [];
  const matches: string[] = [];
  const seen = new Set<string>();

  for (const term of terms) {
    const pattern = termPattern(term);
    let result = pattern.exec(normalized);
    while (result) {
      const prefixLength = result[1]?.length ?? 0;
      const bodyLength = result[2]?.length ?? 0;
      const start = result.index + prefixLength;
      const end = start + bodyLength;
      const originalStart = map[start];
      const endIndex = map[end - 1];

      if (
          originalStart !== undefined &&
          endIndex !== undefined &&
          endIndex + 1 > originalStart
      ) {
        ranges.push({ start: originalStart, end: endIndex + 1 });
        if (!seen.has(term)) {
          seen.add(term);
          matches.push(term);
        }
      }
      result = pattern.exec(normalized);
    }
  }

  ranges.sort((a, b) => a.start - b.start);
  const merged: Array<{ start: number; end: number }> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (!last || range.start > last.end) {
      merged.push({ ...range });
    } else if (range.end > last.end) {
      last.end = range.end;
    }
  }
  const processedText = censorRanges(text, merged);

  return {
    originalText: text,
    processedText,
    containsBlockedContent: matches.length > 0,
    matchedTerms: matches,
    matchCount: merged.length,
  };
}
