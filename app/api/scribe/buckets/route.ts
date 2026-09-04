import { NextRequest, NextResponse } from "next/server";
import { scribeDb, validListToken } from "@/lib/scribe-db";

function unauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// ---- auto color assignment ----

// Legacy palette: buckets created before server-side assignment have no
// stored color; both clients derive one from the id with this djb2 hash.
// Reproduced here so gap-finding sees the colors actually on screen.
const BUCKET_PALETTE = ["#3b82f6", "#22c55e", "#f97316", "#ec4899", "#a855f7", "#14b8a6", "#6366f1", "#ef4444"];
function legacyColor(id: string) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) >>> 0;
  return BUCKET_PALETTE[h % BUCKET_PALETTE.length];
}

function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0; // grey; hue is meaningless but harmless
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

function hslHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// A new bucket takes the hue at the midpoint of the widest empty gap on
// the color wheel, considering every existing color (stored or legacy,
// auto or hand-picked). Existing buckets never move, so there is nothing
// to reacclimate to; distinctness degrades gracefully as buckets grow.
// Saturation/lightness are fixed so hue alone tells buckets apart.
function nextColor(existing: { id: string; color: string | null }[]): string {
  const hues = existing.map((b) => hexToHue(b.color ?? legacyColor(b.id))).sort((x, y) => x - y);
  if (hues.length === 0) return hslHex(217, 0.85, 0.6); // the familiar blue
  let bestGapStart = hues[hues.length - 1];
  let bestGap = hues[0] + 360 - hues[hues.length - 1]; // wrap-around gap
  for (let i = 1; i < hues.length; i++) {
    const gap = hues[i] - hues[i - 1];
    if (gap > bestGap) {
      bestGap = gap;
      bestGapStart = hues[i - 1];
    }
  }
  return hslHex((bestGapStart + bestGap / 2) % 360, 0.85, 0.6);
}

// All methods require ?token=<LIST_TOKEN>

export async function GET(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { data, error } = await scribeDb
    .from("buckets")
    .select("id, name, position, hidden, color, quiet, aliases")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ buckets: data });
}

export async function POST(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "missing name" }, { status: 400 });
  // Hidden buckets still count as occupied hues: they keep their items
  // and can be shown again at any time.
  const { data: existing } = await scribeDb.from("buckets").select("id, color");
  const { data, error } = await scribeDb
    .from("buckets")
    .insert({ name: name.trim(), position: Date.now() / 1000, color: nextColor(existing ?? []) })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bucket: data });
}

// PATCH { id, name?, position?, hidden?, quiet?, aliases? (string or null),
//         color? ("#rrggbb" or null for auto) }
export async function PATCH(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id, ...fields } = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof fields.name === "string" && fields.name.trim()) updates.name = fields.name.trim();
  if (typeof fields.position === "number") updates.position = fields.position;
  if (typeof fields.hidden === "boolean") updates.hidden = fields.hidden;
  if (typeof fields.quiet === "boolean") updates.quiet = fields.quiet;
  // Comma-separated routing keywords; empty/null falls back to the name.
  if ("aliases" in fields) {
    if (fields.aliases === null) updates.aliases = null;
    else if (typeof fields.aliases === "string") updates.aliases = fields.aliases.trim() || null;
  }
  if ("color" in fields) {
    if (fields.color === null) updates.color = null;
    else if (typeof fields.color === "string" && /^#[0-9a-fA-F]{6}$/.test(fields.color)) {
      updates.color = fields.color.toLowerCase();
    }
  }
  if (!id || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "missing id or fields" }, { status: 400 });
  }
  const { data, error } = await scribeDb.from("buckets").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bucket: data });
}

// DELETE { id }: items in the bucket go back to Unsorted (FK on delete set null).
export async function DELETE(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) return unauthorized();
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const { error } = await scribeDb.from("buckets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
