"use client";

import { useEffect, useRef, useState } from "react";

// Shared expand/collapse: the content is always laid out at full size and a
// grid-row mask lerps open over it — like dragging a mask in an editor, the
// text is uncovered rather than arriving. While the mask is moving, its edge
// is feathered to transparent (~12px alpha mask) so the clip line reads as an
// ombre instead of a hard cut; it sharpens again once settled. Use for any
// progressive-disclosure expansion on /practice so they all move the same
// way (Apple-style curve).
const FEATHER = "linear-gradient(to bottom, black calc(100% - 12px), transparent)";

export default function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  const [moving, setMoving] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false; // don't feather the initial render
      return;
    }
    setMoving(true);
  }, [open]);

  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      onTransitionEnd={(e) => e.propertyName === "grid-template-rows" && setMoving(false)}
    >
      <div
        className={`overflow-hidden transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
        style={moving ? { maskImage: FEATHER, WebkitMaskImage: FEATHER } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
