"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REVIEWS, type Review } from "../data/reviews";

// Light-mode ambient review boxes that immediately float around the screen.
// No dark overlay, no intro sequence, no logo — just the typing boxes.

const FONT = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
const ACTIVE_MAX = 14;
const CHAR_MS    = 36;
const HOLD_MS    = 2400;

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

type CardState = "typing" | "hold" | "fading";
interface CardInstance {
  id: number;
  review: Review;
  x: number;       // vw %
  y: number;       // vh %
  driftX: number;
  driftY: number;
  targetDX: number;
  targetDY: number;
  charCount: number;
  cardState: CardState;
  opacity: number;
  holdStarted: number;
}

let _id = 0;
function uid() { return ++_id; }

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newDrift() { return (Math.random() - 0.5) * 55; }

// Positions biased toward screen edges so they frame the central form
function randomPos(): { x: number; y: number } {
  const edge = Math.floor(Math.random() * 4);
  switch (edge) {
    case 0: return { x:  1 + Math.random() * 15, y:  5 + Math.random() * 78 }; // left
    case 1: return { x: 74 + Math.random() * 22, y:  5 + Math.random() * 78 }; // right
    case 2: return { x: 18 + Math.random() * 56, y:  2 + Math.random() * 11 }; // top
    default:return { x: 18 + Math.random() * 56, y: 83 + Math.random() * 13 }; // bottom
  }
}

function makeCard(review: Review): CardInstance {
  const pos = randomPos();
  return {
    id: uid(), review,
    x: pos.x, y: pos.y,
    driftX: 0, driftY: 0,
    targetDX: newDrift(), targetDY: newDrift(),
    charCount: 0, cardState: "typing",
    opacity: 0, holdStarted: 0,
  };
}

// ── Sub-components ────────────────────────────────────────────

function Stars({ stars }: { stars: number }) {
  return (
    <div style={{ fontSize: "12px", letterSpacing: "1px", lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ color: i < stars ? "#f59e0b" : "#d1d5db" }}>★</span>
      ))}
    </div>
  );
}

function Tag({ tag }: { tag: string }) {
  const s = TAG_STYLE[tag];
  if (!s) return null;
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

interface BubbleProps { card: CardInstance; blink: boolean; }
function ReviewBubble({ card, blink }: BubbleProps) {
  const { review, charCount, opacity, driftX, driftY, cardState } = card;
  const fullText  = review.text;
  const visible   = fullText.slice(0, charCount);
  const typing    = cardState === "typing" && charCount < fullText.length;
  const showMeta  = charCount > fullText.length * 0.45;

  return (
    <div
      aria-hidden="true"
      style={{
        position:      "fixed",
        left:          `${card.x}vw`,
        top:           `${card.y}vh`,
        transform:     `translate(${driftX}px, ${driftY}px) scale(0.84)`,
        transformOrigin: "top left",
        transition:    "transform 3.5s ease-in-out, opacity 0.9s ease",
        opacity,
        width:         "195px",
        padding:       "10px 12px",
        background:    "rgba(255,255,255,0.85)",
        border:        "1px solid rgba(0,0,0,0.08)",
        borderRadius:  "6px",
        backdropFilter:"blur(4px)",
        pointerEvents: "none",
        userSelect:    "none",
        zIndex:        2,
      }}
    >
      {/* Course header */}
      <div style={{ marginBottom: "5px", lineHeight: 1.2 }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#cc0000", letterSpacing: "0.04em", fontFamily: FONT }}>
          {review.courseCode}
        </span>
        <span style={{ fontSize: "10px", color: "rgba(100,100,100,0.72)", fontFamily: FONT }}>
          {" · "}{review.courseName}
        </span>
      </div>

      {/* Typewriter text */}
      <div style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(25,25,25,0.88)", minHeight: "38px", marginBottom: "6px", fontFamily: FONT }}>
        {visible}
        {typing && blink && (
          <span style={{
            display: "inline-block", width: "1.5px", height: "13px",
            background: "#cc0000", marginLeft: "1px",
            verticalAlign: "middle", borderRadius: "1px",
          }} />
        )}
      </div>

      {/* Stars + tags appear at ~45% typed */}
      {showMeta && (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <Stars stars={review.stars} />
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {review.tags.map((t) => <Tag key={t} tag={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

export default function AmbientReviews() {
  const [cards, setCards] = useState<CardInstance[]>([]);
  const [blink, setBlink] = useState(true);

  const reviewPoolRef = useRef<Review[]>(shuffled(REVIEWS));
  const usedIdxRef    = useRef(0);

  const nextReview = useCallback((): Review => {
    if (usedIdxRef.current >= reviewPoolRef.current.length) {
      reviewPoolRef.current = shuffled(REVIEWS);
      usedIdxRef.current    = 0;
    }
    return reviewPoolRef.current[usedIdxRef.current++];
  }, []);

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setBlink((b) => !b), 530);
    return () => clearInterval(t);
  }, []);

  // Typewriter tick + hold-to-fade lifecycle
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCards((prev) =>
        prev.map((card) => {
          if (card.cardState === "fading") return card;
          if (card.cardState === "hold") {
            if (card.holdStarted > 0 && now - card.holdStarted > HOLD_MS) {
              return { ...card, cardState: "fading" as CardState, opacity: 0 };
            }
            return card;
          }
          // typing
          const max = card.review.text.length;
          if (card.charCount >= max) {
            return { ...card, cardState: "hold" as CardState, holdStarted: Date.now() };
          }
          return { ...card, charCount: card.charCount + 1 };
        })
      );
    }, CHAR_MS);
    return () => clearInterval(interval);
  }, []);

  // Gentle drift every 3.5 s
  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prev) =>
        prev.map((card) =>
          card.cardState === "fading"
            ? card
            : { ...card, driftX: card.targetDX, driftY: card.targetDY, targetDX: newDrift(), targetDY: newDrift() }
        )
      );
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Spawn & reap — keep up to ACTIVE_MAX visible cards
  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prev) => {
        const alive = prev.filter((c) => !(c.cardState === "fading" && c.opacity === 0));
        const activeCount = alive.filter((c) => c.opacity > 0.1).length;
        // Spawn up to 2 at a time when well below the cap so the screen fills quickly
        const spawnCount = activeCount < ACTIVE_MAX - 4 ? 2 : activeCount < ACTIVE_MAX ? 1 : 0;
        if (spawnCount === 0) return alive;
        const newCards = Array.from({ length: spawnCount }, () => {
          const card = makeCard(nextReview());
          setTimeout(() => {
            setCards((p) => p.map((c) => (c.id === card.id ? { ...c, opacity: 0.78 } : c)));
          }, 60);
          return card;
        });
        return [...alive, ...newCards];
      });
    }, 750);
    return () => clearInterval(interval);
  }, [nextReview]);

  return (
    <>
      {cards.map((card) => (
        <ReviewBubble key={card.id} card={card} blink={blink} />
      ))}
    </>
  );
}
