"use client";

// Shared expand/collapse: the content is always laid out at full size and a
// grid-row mask lerps open over it — like dragging a mask in an editor, the
// text is uncovered rather than arriving. Use for any progressive-disclosure
// expansion on /practice so they all move the same way (Apple-style curve).
export default function Reveal({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div
        className={`overflow-hidden transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      >
        {children}
      </div>
    </div>
  );
}
