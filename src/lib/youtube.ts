import { YoutubeTranscript } from "youtube-transcript";

export class YoutubeError extends Error {}

export function extractVideoId(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new YoutubeError("That doesn't look like a valid URL.");
  }

  const host = parsed.hostname.replace(/^www\./, "");
  let id: string | null = null;

  if (host === "youtu.be") {
    id = parsed.pathname.slice(1);
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (parsed.pathname === "/watch") {
      id = parsed.searchParams.get("v");
    } else if (parsed.pathname.startsWith("/shorts/")) {
      id = parsed.pathname.split("/")[2];
    } else if (parsed.pathname.startsWith("/embed/")) {
      id = parsed.pathname.split("/")[2];
    }
  }

  if (!id || !/^[a-zA-Z0-9_-]{6,}$/.test(id)) {
    throw new YoutubeError(
      "Couldn't find a video ID in that link. Paste a standard YouTube watch, shorts, or youtu.be link.",
    );
  }

  return id;
}

export interface TranscriptSegment {
  text: string;
  offsetSeconds: number;
}

export async function fetchTranscript(
  videoId: string,
): Promise<TranscriptSegment[]> {
  try {
    const raw = await YoutubeTranscript.fetchTranscript(videoId);
    if (!raw || raw.length === 0) {
      throw new YoutubeError("This video doesn't have any captions available.");
    }
    return raw.map((seg) => ({
      text: seg.text,
      offsetSeconds: Math.round(seg.offset / 1000),
    }));
  } catch (err) {
    if (err instanceof YoutubeError) throw err;
    const message = err instanceof Error ? err.message : String(err);
    if (/disabled|transcript/i.test(message)) {
      throw new YoutubeError(
        "This video doesn't have captions available, so notes can't be generated.",
      );
    }
    throw new YoutubeError(
      "Couldn't fetch this video. It may be private, age-restricted, or unavailable.",
    );
  }
}

export async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}&format=json`,
    );
    if (!res.ok) return "Untitled video";
    const data = (await res.json()) as { title?: string };
    return data.title ?? "Untitled video";
  } catch {
    return "Untitled video";
  }
}

export function formatTimestamp(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = m.toString().padStart(h > 0 ? 2 : 1, "0");
  const ss = s.toString().padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
