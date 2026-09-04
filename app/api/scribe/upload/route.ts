import { NextRequest, NextResponse } from "next/server";
import { scribeDb } from "@/lib/scribe-db";
import { routeCapture } from "@/lib/scribe-routing";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/scribe/upload
// Auth: Authorization: Bearer <DEVICE_TOKEN>
// Body: multipart/form-data with "audio" file, optional "recorded_at" ISO string
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.DEVICE_TOKEN || auth !== `Bearer ${process.env.DEVICE_TOKEN}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "missing audio file" }, { status: 400 });
  }

  const whisperForm = new FormData();
  whisperForm.append("file", audio, audio.name || "clip.wav");
  whisperForm.append("model", "whisper-1");

  const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: whisperForm,
  });
  if (!whisperRes.ok) {
    const detail = await whisperRes.text();
    return NextResponse.json({ error: "transcription failed", detail }, { status: 502 });
  }
  const { text } = (await whisperRes.json()) as { text: string };
  const transcript = text.trim();
  if (!transcript) {
    return NextResponse.json({ error: "empty transcript" }, { status: 422 });
  }

  const { data: capture, error: capErr } = await scribeDb
    .from("captures")
    .insert({
      transcript,
      recorded_at: (form.get("recorded_at") as string) || new Date().toISOString(),
    })
    .select()
    .single();
  if (capErr) {
    return NextResponse.json({ error: capErr.message }, { status: 500 });
  }

  // Keyword routing: a leading trigger word or a unique bucket alias in
  // the transcript files the todo automatically (see lib/scribe-routing).
  const { data: routable } = await scribeDb.from("buckets").select("id, name, aliases");
  const routed = routeCapture(transcript, routable ?? []);

  // One todo per capture for v1. Later: LLM pass to split multi-item captures.
  const { data: todo, error: todoErr } = await scribeDb
    .from("todos")
    .insert({
      text: routed.text,
      bucket_id: routed.bucketId,
      capture_id: capture.id,
      position: Date.now() / 1000,
      all_position: Date.now() / 1000,
    })
    .select()
    .single();
  if (todoErr) {
    return NextResponse.json({ error: todoErr.message }, { status: 500 });
  }

  return NextResponse.json({ capture_id: capture.id, todo });
}
