"use client";

import { useEffect, useRef } from "react";

// Super tiny cousin of the syllabus's string-unison celebration: six strings
// ripple with damped standing waves in amber, then settle. Renders inline
// (no overlay) wherever the timer lives; mounts, plays ~3s, parent unmounts.
export default function TinyUnison({ width = 220, height = 56 }: { width?: number; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const strings = 6;
    const start = performance.now();
    let raf = 0;
    const draw = (now: number) => {
      const t = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      for (let s = 0; s < strings; s++) {
        const y0 = ((s + 1) / (strings + 1)) * height;
        const delay = s * 0.09; // plucked low-to-high
        const tt = Math.max(0, t - delay);
        const amp = 5.5 * Math.exp(-tt * 1.6) * (tt > 0 ? 1 : 0);
        const freq = 2 + s * 0.5; // higher strings wiggle faster
        ctx.beginPath();
        for (let x = 0; x <= width; x += 3) {
          // Standing wave pinned at both ends.
          const y = y0 + amp * Math.sin((x / width) * Math.PI) * Math.sin(tt * freq * Math.PI * 2);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const glow = Math.min(1, amp / 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.35 + glow * 0.65})`; // amber-500
        ctx.lineWidth = 1 + glow * 0.6;
        ctx.stroke();
      }
      if (t < 3.4) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [width, height]);

  return <canvas ref={ref} style={{ width, height }} aria-label="session complete" role="img" />;
}
