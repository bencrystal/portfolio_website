import { NextRequest, NextResponse } from "next/server";

// Thin proxy over the YouTube Data API so the key stays server-side.
// Without ?q it just reports whether search is configured, so the client
// can hide the search box when there's no key.

export async function GET(req: NextRequest) {
  const key = process.env.YOUTUBE_API_KEY;
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ enabled: !!key });
  if (!key) return NextResponse.json({ error: "search not configured" }, { status: 501 });

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return NextResponse.json({ error: `youtube ${res.status}` }, { status: 502 });
  const data = await res.json();
  type Item = {
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string; thumbnails?: { default?: { url?: string } } };
  };
  const results = ((data.items ?? []) as Item[])
    .filter((i) => i.id?.videoId)
    .map((i) => ({
      id: i.id!.videoId!,
      title: i.snippet?.title ?? "",
      channel: i.snippet?.channelTitle ?? "",
      thumb: i.snippet?.thumbnails?.default?.url ?? null,
    }));
  return NextResponse.json({ results });
}
