"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  TypewriterBackground
//
//  Cinematic loop for the login page:
//   TYPING  →  10 large review texts type across the full viewport
//   BLUR    →  all text blurs out  (CSS filter transition)
//   LOGO    →  NorthStar + motto fades in as the centre of attention
//   CLEAR   →  logo fades, blur clears, text fades to 0
//   (repeat with fresh random reviews)
//
//  The review text is the spectacle — the course label is a small accent.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { REVIEWS } from "@/src/app/onboarding/data/reviews";

type Phase = "TYPING" | "BLUR" | "LOGO" | "CLEAR";

const FONT   = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const MOTTO  = "Know everything about your courses.";
const CHAR_MS = 26; // ms per character

// ── Grid-based placement ──────────────────────────────────────
// The viewport is divided into a 3-column × 4-row grid of 12 cells.
// Each cycle we shuffle the cells and assign one snippet per cell,
// then add random jitter within the cell.  This prevents overlap
// (each snippet lives in its own region) while keeping every cycle
// visually different (jitter + randomised size / lineChars / maxW).
const GRID_CELLS = [
  // row 0 — top strip
  { cx:  8, cy:  7 }, { cx: 40, cy:  5 }, { cx: 74, cy:  6 },
  // row 1 — upper-mid
  { cx:  8, cy: 28 }, { cx: 40, cy: 29 }, { cx: 74, cy: 28 },
  // row 2 — lower-mid
  { cx:  8, cy: 52 }, { cx: 40, cy: 53 }, { cx: 74, cy: 52 },
  // row 3 — bottom strip
  { cx:  8, cy: 74 }, { cx: 40, cy: 75 }, { cx: 74, cy: 74 },
];

function randomSlots(count: number) {
  return shuffled(GRID_CELLS)
    .slice(0, count)
    .map((cell) => {
      const x = Math.max(5, cell.cx + (Math.random() - 0.5) * 6);
      // Cap maxW for right-column snippets so they don't bleed off-screen
      const maxWBase = x > 65 ? 160 + Math.floor(Math.random() * 100) // 160–260 px
                               : 210 + Math.floor(Math.random() * 200); // 210–410 px
      return {
        // Jitter within the cell so exact position differs every loop
        x,
        y:         Math.max(5, cell.cy + (Math.random() - 0.5) * 6),
        size:      15 + Math.floor(Math.random() * 10),   // 15–24 px
        lineChars: 14 + Math.floor(Math.random() * 20),   // 14–33 chars/line
        maxW:      maxWBase,
        delay:     Math.random() * 520,                   // 0–520 ms stagger
      };
    });
}

interface Snippet {
  id: number;
  courseCode: string;
  courseName: string;
  body: string;       // review text, pre-wrapped with \n
  x: number;
  y: number;
  size: number;
  maxW: number;
  charCount: number;
  delay: number;      // ms before this snippet starts typing
}

let _uid = 0;
function uid() { return ++_uid; }

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Word-wrap text into lines of at most `maxChars` characters, joined by \n
function wrap(text: string, maxChars: number): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    if (line && line.length + 1 + word.length > maxChars) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TypewriterBackground() {
  const [phase,       setPhase]       = useState<Phase>("TYPING");
  const [snippets,    setSnippets]    = useState<Snippet[]>([]);
  const [blurPx,      setBlurPx]      = useState(0);
  const [textOpacity, setTextOpacity] = useState(1);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [blink,       setBlink]       = useState(true);

  const cycleStart = useRef(Date.now());

  // ── Spawn a new set of 10 snippets ───────────────────────────
  const startCycle = useCallback(() => {
    const pool  = shuffled(REVIEWS);
    const count = 9 + Math.floor(Math.random() * 4); // 9–12 snippets per cycle
    const slots = randomSlots(count);
    cycleStart.current = Date.now();
    setSnippets(
      slots.map((slot, i) => ({
        id:         uid(),
        courseCode: pool[i].courseCode,
        courseName: pool[i].courseName,
        body:       wrap(pool[i].text, slot.lineChars),
        x:          slot.x,
        y:          slot.y,
        size:       slot.size,
        maxW:       slot.maxW,
        charCount:  0,
        delay:      slot.delay,
      }))
    );
    setPhase("TYPING");
    setBlurPx(0);
    setTextOpacity(1);
    setLogoOpacity(0);
  }, []);

  useEffect(() => { startCycle(); }, [startCycle]);

  // ── Cursor blink ─────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(t);
  }, []);

  // ── Typewriter tick ──────────────────────────────────────────
  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Date.now() - cycleStart.current;
      setSnippets((prev) =>
        prev.map((s) => {
          if (elapsed < s.delay) return s;
          if (s.charCount >= s.body.length) return s;
          return { ...s, charCount: s.charCount + 1 };
        })
      );
    }, CHAR_MS);
    return () => clearInterval(iv);
  }, []);

  // ── Phase machine ────────────────────────────────────────────
  // TYPING → BLUR after 3.2 s
  useEffect(() => {
    if (phase !== "TYPING") return;
    const t = setTimeout(() => {
      setPhase("BLUR");
      setBlurPx(9);
      setTextOpacity(0.18);
    }, 3200);
    return () => clearTimeout(t);
  }, [phase]);

  // BLUR → LOGO after blur transition finishes (~700 ms)
  useEffect(() => {
    if (phase !== "BLUR") return;
    const t = setTimeout(() => {
      setPhase("LOGO");
      setLogoOpacity(1);
    }, 750);
    return () => clearTimeout(t);
  }, [phase]);

  // LOGO → CLEAR after 1.6 s hold
  useEffect(() => {
    if (phase !== "LOGO") return;
    const t = setTimeout(() => {
      setPhase("CLEAR");
      setLogoOpacity(0);
      setBlurPx(0);
      setTextOpacity(0);
    }, 1600);
    return () => clearTimeout(t);
  }, [phase]);

  // CLEAR → new cycle after fade (~900 ms)
  useEffect(() => {
    if (phase !== "CLEAR") return;
    const t = setTimeout(() => startCycle(), 950);
    return () => clearTimeout(t);
  }, [phase, startCycle]);

  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Typed snippets ──────────────────────────────────── */}
      {snippets.map((s) => {
        const done    = s.charCount >= s.body.length;
        const visible = s.body.slice(0, s.charCount);
        return (
          <div
            key={s.id}
            aria-hidden="true"
            style={{
              position:      "fixed",
              left:          `${s.x}vw`,
              top:           `${s.y}vh`,
              maxWidth:      `${s.maxW}px`,
              pointerEvents: "none",
              userSelect:    "none",
              zIndex:        2,
              filter:        `blur(${blurPx}px)`,
              opacity:       textOpacity,
              transition:    "filter 0.7s ease, opacity 0.7s ease",
            }}
          >
            {/* Course accent — small, sits above the big text */}
            <div style={{
              fontFamily:    FONT,
              fontSize:      "10px",
              fontWeight:    600,
              color:         "#cc0000",
              letterSpacing: "0.06em",
              opacity:       0.75,
              marginBottom:  "5px",
              lineHeight:    1,
            }}>
              {s.courseCode}
              <span style={{ fontWeight: 400, color: "#aaa", marginLeft: "5px" }}>
                {s.courseName}
              </span>
            </div>

            {/* Review body — the star of the show */}
            <div style={{
              fontFamily:  FONT,
              fontSize:    `${s.size}px`,
              color:       "#0d0d0d",
              lineHeight:  1.58,
              whiteSpace:  "pre-wrap",
            }}>
              {visible}
              {/* Blinking cursor while typing */}
              {!done && (
                <span style={{
                  display:         "inline-block",
                  width:           "2px",
                  height:          `${s.size * 0.85}px`,
                  backgroundColor: blink ? "#cc0000" : "transparent",
                  marginLeft:      "1px",
                  verticalAlign:   "middle",
                  borderRadius:    "1px",
                }} />
              )}
            </div>
          </div>
        );
      })}

      {/* ── Centre logo reveal ──────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:       "fixed",
          inset:          0,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          opacity:        logoOpacity,
          transition:     "opacity 1s ease",
          pointerEvents:  "none",
          zIndex:         8,
        }}
      >
        <div style={{
          fontFamily:    FONT,
          fontSize:      "clamp(58px, 11vw, 140px)",
          fontWeight:    900,
          letterSpacing: "-0.03em",
          lineHeight:    1,
          color:         "#0d0d0d",
        }}>
          North<span style={{ color: "#cc0000" }}>Star</span>
        </div>
        <div style={{
          fontFamily:    FONT,
          fontSize:      "clamp(13px, 1.6vw, 20px)",
          color:         "#666",
          marginTop:     "18px",
          letterSpacing: "0.05em",
          fontWeight:    400,
        }}>
          {MOTTO}
        </div>
      </div>
    </>
  );
}
