"use client";

import { useEffect, useRef } from "react";

// Horizontal ruler-style tempo dial, ported from the GridKey iOS app's
// BPMRulerDial: drag left/right to scrub BPM, ticks every 5 with labeled
// majors every 20, and a fixed center indicator. Any whole BPM is reachable,
// but values near a multiple of 5 are magnetically pulled onto it (vibration
// per detent where supported) — 90/95/100 snap easily while 91-94 remain one
// smooth drag away.

const MIN = 20;
const MAX = 300;
const STEP = 5;
const POINTS_PER_BPM = 6;
const HEIGHT = 56;

function softSnap(v: number) {
  const detent = Math.round(v / STEP) * STEP;
  if (Math.abs(v - detent) <= 1.2) return detent;
  return Math.round(v);
}

export default function BpmRuler({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const valueRef = useRef(value);
  const drag = useRef<{ startValue: number; startX: number } | null>(null);
  const continuous = useRef<number | null>(null);

  valueRef.current = value;

  useEffect(() => {
    const canvas = canvasRef.current!;

    function draw() {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      if (canvas.width !== width * dpr) {
        canvas.width = width * dpr;
        canvas.height = HEIGHT * dpr;
      }
      const g = canvas.getContext("2d")!;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, width, HEIGHT);

      const center = width / 2;
      const current = continuous.current ?? valueRef.current;
      const majorEvery = STEP * 4; // labeled tick every 20 bpm
      const edgeFade = 36;

      g.textAlign = "center";
      g.font = "600 10px system-ui, sans-serif";
      for (let bpm = MIN; bpm <= MAX; bpm += STEP) {
        const x = center + (bpm - current) * POINTS_PER_BPM;
        if (x < -20 || x > width + 20) continue;
        const isMajor = bpm % majorEvery === 0;
        const tickHeight = isMajor ? 18 : 10;
        // Ticks fade toward the edges so the ruler feels like it emerges
        // from the card rather than being clipped by it.
        const opacity = Math.min(1, Math.max(0, Math.min(x, width - x) / edgeFade));
        g.strokeStyle = `rgba(163,163,163,${(isMajor ? 0.8 : 0.4) * opacity})`;
        g.lineWidth = isMajor ? 2 : 1;
        g.beginPath();
        g.moveTo(x, HEIGHT - 14);
        g.lineTo(x, HEIGHT - 14 - tickHeight);
        g.stroke();
        if (isMajor) {
          g.fillStyle = `rgba(163,163,163,${opacity})`;
          g.fillText(String(bpm), x, HEIGHT - 2);
        }
      }

      // Fixed center indicator.
      g.fillStyle = "#f59e0b";
      g.beginPath();
      g.roundRect(center - 1.5, 4, 3, HEIGHT - 26, 1.5);
      g.fill();
    }

    draw();

    function onPointerDown(e: PointerEvent) {
      canvas.setPointerCapture(e.pointerId);
      drag.current = { startValue: valueRef.current, startX: e.clientX };
    }
    function onPointerMove(e: PointerEvent) {
      if (!drag.current) return;
      const raw = drag.current.startValue - (e.clientX - drag.current.startX) / POINTS_PER_BPM;
      const clamped = Math.min(MAX, Math.max(MIN, raw));
      continuous.current = clamped;
      const snapped = softSnap(clamped);
      if (snapped !== valueRef.current) {
        valueRef.current = snapped;
        onChange(snapped);
        // Vibrate only on the 5-detents so free scrubbing between them
        // doesn't buzz on every integer. (No-op on iOS Safari.)
        if (snapped % STEP === 0) navigator.vibrate?.(3);
      }
      draw();
    }
    function onPointerUp() {
      drag.current = null;
      continuous.current = null;
      draw();
    }

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("resize", draw);

    // Redraw when the (external) value changes without a drag.
    let raf = 0;
    let lastDrawn = valueRef.current;
    function watch() {
      if (!drag.current && valueRef.current !== lastDrawn) {
        lastDrawn = valueRef.current;
        draw();
      } else if (drag.current) {
        lastDrawn = valueRef.current;
      }
      raf = requestAnimationFrame(watch);
    }
    raf = requestAnimationFrame(watch);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", draw);
      cancelAnimationFrame(raf);
    };
  }, [onChange]);

  return (
    <canvas
      ref={canvasRef}
      role="slider"
      aria-label="tempo"
      aria-valuemin={MIN}
      aria-valuemax={MAX}
      aria-valuenow={value}
      className="w-full cursor-ew-resize select-none"
      style={{ height: HEIGHT, touchAction: "none" }}
    />
  );
}
