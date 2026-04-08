"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAnimationReviews, type Review } from "@/src/hooks/useAnimationReviews";

// ─────────────────────────────────────────────────────────────
//  Stage machine
//  TYPING      → reviews type in, logo dim
//  LOGO_RISE   → logo brightens over 1.2s
//  MOTTO_IN    → motto types char-by-char
//  DISSOLVE    → dark bg fades, reviews dim, form slides in
//  ACTIVE      → ambient mode: reviews drift & recycle forever
// ─────────────────────────────────────────────────────────────
type Stage = "TYPING" | "LOGO_RISE" | "MOTTO_IN" | "DISSOLVE" | "ACTIVE";

const MOTTO = "Know everything about your courses.";
const CHAR_MS_INTRO = 28;   // ms per character during intro burst
const CHAR_MS_ACTIVE = 38;  // ms per character in ambient mode
const ACTIVE_MAX = 5;       // simultaneous reviews in ambient mode

// tag color palette
const TAG_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  "exam-heavy":          { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  "project-heavy":       { bg: "#fff7ed", text: "#ea580c", border: "#fdba74" },
  "group-work":          { bg: "#ede9fe", text: "#7c3aed", border: "#c4b5fd" },
  "attendance-required": { bg: "#dbeafe", text: "#2563eb", border: "#93c5fd" },
  "strict_deadlines":    { bg: "#fce7f3", text: "#be185d", border: "#f9a8d4" },
  "flexible_deadlines":  { bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
  "extra_credit":        { bg: "#fef9c3", text: "#ca8a04", border: "#fde047" },
  "little_to_no_test":   { bg: "#cffafe", text: "#0891b2", border: "#67e8f9" },
  "fast_paced":          { bg: "#fee2e2", text: "#dc2626", border: "#fca5a5" },
  "slow_paced":          { bg: "#dcfce7", text: "#16a34a", border: "#86efac" },
};
const TAG_LABEL: Record<string, string> = {
  "exam-heavy": "exam heavy", "project-heavy": "project heavy",
  "group-work": "group work", "attendance-required": "attendance req.",
  "strict_deadlines": "strict deadlines", "flexible_deadlines": "flex deadlines",
  "extra_credit": "extra credit", "little_to_no_test": "low test load",
  "fast_paced": "fast paced", "slow_paced": "slow paced",
};

// ─────────────────────────────────────────────────────────────
//  Review card instance
// ─────────────────────────────────────────────────────────────
type CardState = "typing" | "hold" | "fading";
interface CardInstance {
  id: number;
  review: Review;
  x: number;       // vw %
  y: number;       // vh %
  driftX: number;  // current drift offset px
  driftY: number;
  targetDX: number;
  targetDY: number;
  charCount: number;
  cardState: CardState;
  opacity: number;
  holdStarted: number;  // timestamp when typing finished
  scale: number;        // 1 during intro, ~0.85 in ambient
}

// Eight fixed zones for intro placement (% of screen, keeping off center)
const INTRO_ZONES = [
  { x:  3, y:  8 }, { x: 37, y:  5 }, { x: 68, y:  8 },
  { x:  2, y: 42 },                   { x: 70, y: 40 },
  { x:  3, y: 73 }, { x: 36, y: 76 }, { x: 68, y: 72 },
];

let nextId = 0;
function uid() { return ++nextId; }

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Positions for ambient mode: bias toward edges so they frame the form
function randomAmbientPos(): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0: return { x: 1  + Math.random() * 16, y:  5 + Math.random() * 78 }; // left
    case 1: return { x: 73 + Math.random() * 22, y:  5 + Math.random() * 78 }; // right
    case 2: return { x: 18 + Math.random() * 56, y:  2 + Math.random() * 12 }; // top
    default:return { x: 18 + Math.random() * 56, y: 82 + Math.random() * 14 }; // bottom
  }
}

function newDrift() {
  return (Math.random() - 0.5) * 60; // ±30 px
}

function makeIntroCard(zone: { x: number; y: number }, review: Review, scale = 1): CardInstance {
  return {
    id: uid(), review,
    x: zone.x, y: zone.y,
    driftX: 0, driftY: 0,
    targetDX: newDrift(), targetDY: newDrift(),
    charCount: 0, cardState: "typing",
    opacity: 1, holdStarted: 0, scale,
  };
}

function makeAmbientCard(review: Review): CardInstance {
  const pos = randomAmbientPos();
  return {
    id: uid(), review,
    x: pos.x, y: pos.y,
    driftX: 0, driftY: 0,
    targetDX: newDrift(), targetDY: newDrift(),
    charCount: 0, cardState: "typing",
    opacity: 0, holdStarted: 0, scale: 0.82,
  };
}

// ─────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────

function StarRow({ stars, dark }: { stars: number; dark: boolean }) {
  return (
    <div style={{ fontSize: "12px", letterSpacing: "1px", lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < stars ? "#f59e0b" : (dark ? "#444" : "#d1d5db") }}>★</span>
      ))}
    </div>
  );
}

function TagChip({ tag, dark }: { tag: string; dark: boolean }) {
  const s = TAG_STYLE[tag];
  if (!s) return null;
  if (dark) {
    return (
      <span style={{
        fontSize: "10px", padding: "2px 6px", borderRadius: "3px",
        background: s.text + "22", color: s.text, border: `1px solid ${s.text}55`,
        fontWeight: 500, letterSpacing: "0.02em", whiteSpace: "nowrap",
      }}>
        {TAG_LABEL[tag]}
      </span>
    );
  }
  return (
    <span style={{
      fontSize: "10px", padding: "2px 6px", borderRadius: "3px",
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      fontWeight: 500, letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>
      {TAG_LABEL[tag]}
    </span>
  );
}

interface ReviewBubbleProps {
  card: CardInstance;
  dark: boolean;
  showCursorBlink: boolean;
}

function ReviewBubble({ card, dark, showCursorBlink }: ReviewBubbleProps) {
  const { review, charCount, opacity, driftX, driftY, cardState, scale } = card;
  const fullText = review.text;
  const visible  = fullText.slice(0, charCount);
  const typing   = cardState === "typing" && charCount < fullText.length;
  const showMeta = charCount > fullText.length * 0.45;

  const courseColor  = dark ? "#ff7070" : "var(--color-primary-navy)";
  const textColor    = dark ? "rgba(230,230,230,0.92)" : "rgba(28,25,23,0.88)";
  const mutedColor   = dark ? "rgba(160,160,160,0.75)" : "rgba(87,83,78,0.72)";
  const borderColor  = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const bgColor      = dark ? "rgba(18,18,18,0.82)" : "rgba(255,255,255,0.72)";
  const cursorColor  = dark ? "#ff7070" : "var(--color-primary-navy)";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        left: `${card.x}vw`,
        top:  `${card.y}vh`,
        transform: `translate(${driftX}px, ${driftY}px) scale(${scale})`,
        transformOrigin: "top left",
        transition: "transform 3.5s ease-in-out, opacity 0.9s ease",
        opacity,
        width: dark ? "230px" : "195px",
        padding: "10px 12px",
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: "6px",
        backdropFilter: "blur(4px)",
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 2,
      }}
    >
      {/* Course header */}
      <div style={{ marginBottom: "5px", lineHeight: 1.2 }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: courseColor, letterSpacing: "0.04em" }}>
          {review.courseCode}
        </span>
        <span style={{ fontSize: "10px", color: mutedColor }}>
          {" · "}{review.courseName}
        </span>
      </div>

      {/* Typewriter text */}
      <div style={{ fontSize: "12px", lineHeight: 1.55, color: textColor, minHeight: "38px", marginBottom: "6px" }}>
        {visible}
        {typing && showCursorBlink && (
          <span style={{
            display: "inline-block", width: "1.5px", height: "13px",
            background: cursorColor, marginLeft: "1px",
            verticalAlign: "middle", borderRadius: "1px",
            animation: "nsBlinkCursor 0.65s step-end infinite",
          }} />
        )}
      </div>

      {/* Stars + tags — reveal at ~45% typed */}
      {showMeta && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <StarRow stars={review.stars} dark={dark} />
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {review.tags.map((t) => <TagChip key={t} tag={t} dark={dark} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// Center logo + motto overlay
interface LogoProps {
  logoOpacity: number;
  mottoCount: number;
  dark: boolean;
}
function CenterLogo({ logoOpacity, mottoCount, dark }: LogoProps) {
  const mottoVisible = MOTTO.slice(0, mottoCount);
  const wordColor    = dark ? "#ffffff" : "var(--color-text-primary)";
  const accentColor  = dark ? "#ff5555" : "var(--color-primary-navy)";
  const mottoColor   = dark ? "rgba(200,200,200,0.85)" : "rgba(80,80,80,0.85)";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity: logoOpacity,
        transition: "opacity 1.2s ease",
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      <div style={{
        fontSize: "clamp(52px, 8vw, 80px)",
        fontWeight: 900,
        letterSpacing: "-0.03em",
        lineHeight: 1,
        textAlign: "center",
        textShadow: dark ? "0 0 60px rgba(255,80,80,0.35)" : "none",
      }}>
        <span style={{ color: wordColor }}>North</span>
        <span style={{ color: accentColor }}>Star</span>
      </div>

      <div style={{
        marginTop: "14px",
        fontSize: "clamp(13px, 1.6vw, 18px)",
        color: mottoColor,
        letterSpacing: "0.06em",
        minHeight: "24px",
        fontWeight: 400,
      }}>
        {mottoVisible}
        {mottoCount < MOTTO.length && mottoCount > 0 && (
          <span style={{
            display: "inline-block", width: "2px", height: "16px",
            background: accentColor, marginLeft: "2px",
            verticalAlign: "middle", borderRadius: "1px",
            animation: "nsBlinkCursor 0.65s step-end infinite",
          }} />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Main component
// ─────────────────────────────────────────────────────────────
interface Props {
  onComplete: () => void;
}

export default function CinematicBackground({ onComplete }: Props) {
  const reviews = useAnimationReviews();
  const [stage,       setStage]       = useState<Stage>("TYPING");
  const [cards,       setCards]       = useState<CardInstance[]>([]);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [mottoCount,  setMottoCount]  = useState(0);
  const [bgOpacity,   setBgOpacity]   = useState(1);   // 1 = full dark overlay
  const [dark,        setDark]        = useState(true);
  const [blink,       setBlink]       = useState(true); // cursor blink toggle

  const stageRef     = useRef<Stage>("TYPING");
  const cardsRef     = useRef<CardInstance[]>([]);
  const reviewsRef   = useRef<Review[]>([]);
  const reviewPoolRef = useRef<Review[]>([]);
  const usedIdxRef   = useRef(0);

  // Keep reviewsRef in sync so callbacks can access latest reviews
  useEffect(() => {
    reviewsRef.current = reviews;
    if (reviewPoolRef.current.length === 0 && reviews.length > 0) {
      reviewPoolRef.current = shuffled(reviews);
    }
  }, [reviews]);

  stageRef.current = stage;
  cardsRef.current = cards;

  // Pull the next review from the shuffled pool (cycles infinitely)
  const nextReview = useCallback((): Review => {
    if (usedIdxRef.current >= reviewPoolRef.current.length) {
      reviewPoolRef.current = shuffled(reviewsRef.current.length > 0 ? reviewsRef.current : []);
      usedIdxRef.current = 0;
    }
    return reviewPoolRef.current[usedIdxRef.current++];
  }, []);

  // ── Cursor blink (pure JS, avoids needing CSS keyframes everywhere)
  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(t);
  }, []);

  // ── Stage machine ──────────────────────────────────────────
  useEffect(() => {
    // Spawn 7 intro reviews into the 8 fixed zones (skip one at random)
    const zones = shuffled(INTRO_ZONES).slice(0, 7);
    const initial = zones.map((z) => makeIntroCard(z, nextReview()));
    setCards(initial);

    // Stagger the intro card appearances slightly
    initial.forEach((card, i) => {
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) => (c.id === card.id ? { ...c, opacity: 1 } : c))
        );
      }, i * 180);
    });

    // t=2600ms: logo rises
    const t1 = setTimeout(() => {
      setStage("LOGO_RISE");
      setLogoOpacity(0.12);
      setTimeout(() => setLogoOpacity(1), 80);
    }, 2600);

    // t=3800ms: motto starts typing
    const t2 = setTimeout(() => setStage("MOTTO_IN"), 3800);

    // t=5600ms: dissolve — bg fades, reviews dim, onComplete fires
    const t3 = setTimeout(() => {
      setStage("DISSOLVE");
      setBgOpacity(0);
      setDark(false);
      setLogoOpacity(0); // logo hides (form card takes over center)
      // Dim all intro cards
      setCards((prev) =>
        prev.map((c) => ({ ...c, opacity: 0.06, cardState: "hold" as CardState }))
      );
      onComplete();
    }, 5600);

    // t=7000ms: ACTIVE ambient mode begins
    const t4 = setTimeout(() => setStage("ACTIVE"), 7000);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Motto typewriter ───────────────────────────────────────
  useEffect(() => {
    if (stage !== "MOTTO_IN") return;
    const interval = setInterval(() => {
      setMottoCount((n) => {
        if (n >= MOTTO.length) { clearInterval(interval); return n; }
        return n + 1;
      });
    }, 46);
    return () => clearInterval(interval);
  }, [stage]);

  // ── Typewriter for all cards ───────────────────────────────
  useEffect(() => {
    const charMs = stage === "ACTIVE" ? CHAR_MS_ACTIVE : CHAR_MS_INTRO;
    const interval = setInterval(() => {
      const now = Date.now();
      setCards((prev) =>
        prev.map((card) => {
          if (card.cardState !== "typing") {
            // In hold: check if it's time to start fading (ambient only)
            if (card.cardState === "hold" && stageRef.current === "ACTIVE") {
              if (card.holdStarted > 0 && now - card.holdStarted > 2800) {
                return { ...card, cardState: "fading" as CardState, opacity: 0 };
              }
            }
            return card;
          }
          const maxLen = card.review.text.length;
          if (card.charCount >= maxLen) {
            return { ...card, cardState: "hold" as CardState, holdStarted: Date.now() };
          }
          // Advance 1 char
          return { ...card, charCount: card.charCount + 1 };
        })
      );
    }, charMs);
    return () => clearInterval(interval);
  }, [stage]);

  // ── Drift update for ambient cards ────────────────────────
  useEffect(() => {
    if (stage !== "ACTIVE") return;
    const interval = setInterval(() => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.cardState === "fading") return card;
          return {
            ...card,
            driftX: card.targetDX,
            driftY: card.targetDY,
            targetDX: newDrift(),
            targetDY: newDrift(),
          };
        })
      );
    }, 3500);
    return () => clearInterval(interval);
  }, [stage]);

  // ── Ambient card lifecycle (spawn / reap) ──────────────────
  useEffect(() => {
    if (stage !== "ACTIVE") return;
    const interval = setInterval(() => {
      setCards((prev) => {
        // Remove fully faded cards
        const alive = prev.filter((c) => !(c.cardState === "fading" && c.opacity === 0));
        // Count active ambient cards (not the dim intro ones at opacity 0.06)
        const ambientCount = alive.filter((c) => c.opacity > 0.1).length;
        if (ambientCount < ACTIVE_MAX) {
          const review = nextReview();
          const card = makeAmbientCard(review);
          // Fade it in after a tick
          setTimeout(() => {
            setCards((p) =>
              p.map((c) =>
                c.id === card.id ? { ...c, opacity: 0.72 } : c
              )
            );
          }, 60);
          return [...alive, card];
        }
        return alive;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [stage, nextReview]);

  // ── Styles ─────────────────────────────────────────────────
  return (
    <>
      {/* Inject cursor blink keyframe once */}
      <style>{`
        @keyframes nsBlinkCursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>

      {/* Dark overlay — fades out during DISSOLVE */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "radial-gradient(ellipse at center, #111116 0%, #060608 100%)",
          opacity: bgOpacity,
          transition: "opacity 1.8s ease",
          zIndex: 1,
          pointerEvents: bgOpacity > 0.1 ? "all" : "none",
        }}
      />

      {/* Skip intro button */}
      {(stage === "TYPING" || stage === "LOGO_RISE" || stage === "MOTTO_IN") && (
        <button
          onClick={() => {
            setStage("ACTIVE");
            setBgOpacity(0);
            setDark(false);
            setLogoOpacity(0);
            setCards((prev) => prev.map((c) => ({ ...c, opacity: 0.06, cardState: "hold" as CardState })));
            onComplete();
          }}
          style={{
            position: "fixed",
            bottom: "28px",
            right: "28px",
            zIndex: 10,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.25)",
            color: "rgba(255,255,255,0.7)",
            fontSize: "12px",
            fontWeight: 500,
            padding: "7px 14px",
            borderRadius: "4px",
            cursor: "pointer",
            letterSpacing: "0.04em",
            backdropFilter: "blur(4px)",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; }}
        >
          Skip intro ↓
        </button>
      )}

      {/* Center logo + motto */}
      <CenterLogo logoOpacity={logoOpacity} mottoCount={mottoCount} dark={dark} />

      {/* Review bubbles */}
      {cards.map((card) => (
        <ReviewBubble key={card.id} card={card} dark={dark} showCursorBlink={blink} />
      ))}
    </>
  );
}
