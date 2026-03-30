"use client";
import { useEffect, useRef } from "react";

// Course snippets — newlines are preserved via pretext's pre-wrap mode
const SNIPPETS = [
  "CS 3500 · OOD\nDesign patterns & SOLID.\nProject-heavy, very fun.",
  "DS 4400 · Machine Learning\nNeural nets, real data.\nKnow your linear algebra.",
  "MATH 2321 · Calculus 3\nVector fields & surface flux.\nPace yourself each week.",
  "PHYS 1151 · Physics I\nMechanics & thermodynamics.\nWeekly labs, bring coffee.",
  "CS 4810 · Computer Graphics\nOpenGL, shaders, ray-tracing.\nPassion project energy.",
  "ENGW 3302 · Tech Writing\nTechnical communication.\nGreat for your co-op search.",
  "EECE 2160 · Embedded Design\nFPGA programming in VHDL.\nHardware meets software.",
  "CS 3200 · Database Design\nRelational models & SQL.\nFinal project is very fun.",
  "ARTG 2260 · UX Research\nUser testing & prototyping.\nFigma skills a big plus.",
  "CHEM 1161 · General Chem\nStoichiometry to equilibria.\nProf Nguyen is excellent.",
  "CS 2500 · Fundamentals\nHtDP & functional design.\nFirst coding course here.",
  "ECON 1115 · Microeconomics\nSupply, demand, strategy.\nGreat intro for everyone.",
  "BIOL 1101 · Biology I\nCell biology & genetics.\nFriday labs — plan ahead.",
  "CS 4500 · Software Dev\nTeam project, real client.\nStart early, stay organized.",
  "IS 4900 · Professional Dev\nCo-op tips & networking.\nSmall cohort, great vibes.",
];

// pretext uses canvas measurement, so it must only run client-side.
// We import it dynamically inside useEffect to keep SSR clean.
const FONT_STR = "11px 'Merriweather', Georgia, serif";
const COL_W = 160;
const LH = 15;

export default function FloatingTextCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let stopped = false;

    type Block = { lines: string[]; x: number; y: number; vy: number; opacity: number };
    let blocks: Block[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    import("@chenglou/pretext").then(({ prepareWithSegments, layoutWithLines }) => {
      if (stopped) return;

      // pretext's pre-wrap mode preserves our \n hard breaks, giving exactly 3 lines
      // per snippet regardless of column width. layoutWithLines then gives us the
      // measured line strings to draw directly onto the canvas.
      blocks = SNIPPETS.map((text) => {
        const prepared = prepareWithSegments(text, FONT_STR, { whiteSpace: "pre-wrap" });
        const { lines } = layoutWithLines(prepared, COL_W, LH);
        return {
          lines: lines.map((l) => l.text),
          x: Math.random() * Math.max(window.innerWidth - COL_W - 40, 100),
          y: Math.random() * window.innerHeight,
          vy: -(0.06 + Math.random() * 0.1), // slow upward drift
          opacity: 0.035 + Math.random() * 0.025, // barely visible
        };
      });

      const draw = () => {
        if (stopped) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = FONT_STR;
        ctx.fillStyle = "#1C1917"; /* --color-text-primary */

        for (const b of blocks) {
          ctx.globalAlpha = b.opacity;
          b.lines.forEach((line, i) => ctx.fillText(line, b.x, b.y + i * LH));
          b.y += b.vy;
          // wrap back to bottom when fully off-screen
          if (b.y + b.lines.length * LH < -20) {
            b.y = canvas.height + 20;
            b.x = Math.random() * Math.max(canvas.width - COL_W - 40, 100);
          }
        }

        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(draw);
      };

      draw();
    });

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
