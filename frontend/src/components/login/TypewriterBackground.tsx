"use client";

// ─────────────────────────────────────────────────────────────────────────────
//  TypewriterBackground
//
//  Cinematic loop for the login page:
//   TYPING  →  review texts type across the full viewport (italic, quoted)
//   BLUR    →  all text blurs out  (CSS filter transition)
//   LOGO    →  logo.png + motto fades in as the centre of attention
//   CLEAR   →  logo fades, blur clears, text fades to 0
//   (repeat with fresh random reviews)
//
//  Layout: 4 columns with staggered Y positions to avoid a grid-like look.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { REVIEWS } from "@/src/app/onboarding/data/reviews";

type Phase = "TYPING" | "BLUR" | "LOGO" | "CLEAR";

const FONT        = "var(--font-body)";
const MOTTO = "Know everything about your courses.";
const CHAR_MS = 26; // ms per character

// ── 4-column staggered grid ───────────────────────────────────
// Each column has its own vertical offset so snippets never form
// obvious horizontal rows. Y jitter of ±12% adds further variety.
const GRID_CELLS = [
  // col 1 — far left (y stagger: 8, 42, 74)
  { cx:  5, cy:  8 }, { cx:  6, cy: 42 }, { cx:  4, cy: 74 },
  // col 2 — left-center (y stagger: 22, 56, 86)
  { cx: 28, cy: 22 }, { cx: 30, cy: 56 }, { cx: 29, cy: 86 },
  // col 3 — right-center (y stagger: 12, 46, 78)
  { cx: 55, cy: 12 }, { cx: 54, cy: 46 }, { cx: 56, cy: 78 },
  // col 4 — far right (y stagger: 30, 62, 88)
  { cx: 74, cy: 30 }, { cx: 75, cy: 62 }, { cx: 73, cy: 88 },
];

function randomSlots(count: number) {
  return shuffled(GRID_CELLS)
    .slice(0, count)
    .map((cell) => {
      // Large Y jitter so same-column snippets appear at noticeably different heights
      const yJitter = (Math.random() - 0.5) * 12;
      const xJitter = (Math.random() - 0.5) * 5;
      const x = Math.max(3, Math.min(cell.cx + xJitter, 72));
      const y = Math.max(3, Math.min(cell.cy + yJitter, 88));
      // Cap maxW more tightly for right-column snippets so they don't bleed off screen
      const maxWBase = x > 65
        ? 140 + Math.floor(Math.random() * 80)   // 140–220 px
        : 200 + Math.floor(Math.random() * 180);  // 200–380 px
      return {
        x,
        y,
        size:      14 + Math.floor(Math.random() * 9),   // 14–22 px
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
  professorName?: string;
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
        id:            uid(),
        courseCode:    pool[i].professorName ? `Prof. ${pool[i].professorName}` : pool[i].courseCode,
        courseName:    pool[i].professorName ? pool[i].courseName : pool[i].courseName,
        professorName: pool[i].professorName,
        body:          wrap(pool[i].text, slot.lineChars),
        x:             slot.x,
        y:             slot.y,
        size:          slot.size,
        maxW:          slot.maxW,
        charCount:     0,
        delay:         slot.delay,
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
            {/* Course / professor accent */}
            <div style={{
              fontFamily:    FONT,
              fontSize:      "10px",
              fontWeight:    600,
              color:         s.professorName ? "#b45309" : "var(--color-primary-navy)",
              letterSpacing: "0.06em",
              opacity:       0.75,
              marginBottom:  "5px",
              lineHeight:    1,
            }}>
              {s.courseCode}
              <span style={{ fontWeight: 400, color: "var(--color-text-secondary)", marginLeft: "5px" }}>
                {s.courseName}
              </span>
            </div>

            {/* Review body — italic + quoted */}
            <div style={{
              fontFamily: FONT,
              fontSize:   `${s.size}px`,
              fontStyle:  "italic",
              color:      "var(--color-text-primary)",
              lineHeight: 1.58,
              whiteSpace: "pre-wrap",
            }}>
              &ldquo;{visible}
              {/* Blinking cursor while typing */}
              {!done && (
                <span style={{
                  display:         "inline-block",
                  width:           "2px",
                  height:          `${s.size * 0.85}px`,
                  backgroundColor: blink ? "var(--color-primary-navy)" : "transparent",
                  marginLeft:      "1px",
                  verticalAlign:   "middle",
                  borderRadius:    "1px",
                }} />
              )}
              {done && <>&rdquo;</>}
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
        <img
          src="/images/Logo.png"
          alt="NorthStar logo"
          style={{
            height:       "clamp(58px, 11vw, 140px)",
            width:        "auto",
            objectFit:    "contain",
            mixBlendMode: "multiply",
          }}
        />
        <div style={{
          fontFamily:    FONT,
          fontSize:      "clamp(13px, 1.6vw, 20px)",
          color:         "var(--color-text-secondary)",
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
