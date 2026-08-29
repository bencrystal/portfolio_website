import { NextRequest, NextResponse } from "next/server";
import { scribeDb, validListToken } from "@/lib/scribe-db";
import { convert, sanitizeFilename, ConvertInput } from "@/lib/inkdrop-convert";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "inkdrop";

// GET /api/inkdrop?token= -> flat item list; consumed by the e-reader's
// background sync, so keep it small and stable.
export async function GET(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data, error } = await scribeDb
    .from("inkdrop_items")
    .select("id, title, filename, size, status, created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

async function uniqueFilename(desired: string): Promise<string> {
  const { data } = await scribeDb.from("inkdrop_items").select("filename");
  const taken = new Set((data ?? []).map((r) => r.filename));
  if (!taken.has(desired)) return desired;
  const stem = desired.replace(/\.epub$/, "");
  for (let i = 2; ; i++) {
    const candidate = `${stem}-${i}.epub`;
    if (!taken.has(candidate)) return candidate;
  }
}

// POST /api/inkdrop?token=
// multipart/form-data with "file", OR JSON {"url": "..."}
export async function POST(req: NextRequest) {
  if (!validListToken(req.nextUrl.searchParams.get("token"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let input: ConvertInput;
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "missing file" }, { status: 400 });
    }
    input = { kind: "file", name: file.name, buf: Buffer.from(await file.arrayBuffer()) };
  } else {
    const body = (await req.json().catch(() => null)) as { url?: string } | null;
    if (!body?.url || !/^https?:\/\//i.test(body.url)) {
      return NextResponse.json({ error: "missing or invalid url" }, { status: 400 });
    }
    input = { kind: "url", url: body.url };
  }

  let title: string;
  let epub: Buffer;
  try {
    ({ title, epub } = await convert(input));
  } catch (e) {
    return NextResponse.json({ error: `conversion failed: ${(e as Error).message}` }, { status: 422 });
  }

  const filename = await uniqueFilename(sanitizeFilename(title));
  const { error: upErr } = await scribeDb.storage
    .from(BUCKET)
    .upload(filename, epub, { contentType: "application/epub+zip" });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { data: item, error: dbErr } = await scribeDb
    .from("inkdrop_items")
    .insert({ title, filename, size: epub.length })
    .select()
    .single();
  if (dbErr) {
    await scribeDb.storage.from(BUCKET).remove([filename]);
    return NextResponse.json({ error: dbErr.message }, { status: 500 });
  }
  return NextResponse.json({ item });
}
