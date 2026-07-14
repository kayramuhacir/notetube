import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractVideoId,
  fetchTranscript,
  fetchVideoTitle,
  YoutubeError,
} from "@/lib/youtube";
import { generateNotes, type NoteMode } from "@/lib/anthropic";
import { renderNotesPdf } from "@/lib/pdf";

const FREE_DAILY_LIMIT = 1;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Your session has expired. Please log in again." },
      { status: 401 },
    );
  }

  let body: { url?: string; mode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { url, mode } = body;
  if (!url || (mode !== "steps" && mode !== "summary")) {
    return NextResponse.json(
      { error: "Please provide a YouTube link and a note style." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { data: usage }] = await Promise.all([
    admin.from("users").select("is_premium").eq("id", user.id).single(),
    admin
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),
  ]);

  const isPremium = profile?.is_premium ?? false;
  const usedToday = usage?.count ?? 0;

  if (!isPremium && usedToday >= FREE_DAILY_LIMIT) {
    return NextResponse.json(
      {
        error: "You've used your free note for today.",
        upgradeNeeded: true,
      },
      { status: 403 },
    );
  }

  let videoId: string;
  try {
    videoId = extractVideoId(url);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof YoutubeError ? err.message : "Invalid link." },
      { status: 400 },
    );
  }

  let title: string;
  let segments;
  try {
    [title, segments] = await Promise.all([
      fetchVideoTitle(videoId),
      fetchTranscript(videoId),
    ]);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof YoutubeError
            ? err.message
            : "Couldn't fetch this video. Please try a different link.",
      },
      { status: 400 },
    );
  }

  let sections;
  try {
    sections = await generateNotes(title, segments, mode as NoteMode);
  } catch {
    return NextResponse.json(
      { error: "Couldn't generate notes for this video. Please try again." },
      { status: 500 },
    );
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderNotesPdf(title, url, sections);
  } catch {
    return NextResponse.json(
      { error: "Couldn't create the PDF. Please try again." },
      { status: 500 },
    );
  }

  const pdfPath = `${user.id}/${randomUUID()}.pdf`;
  const { error: uploadError } = await admin.storage
    .from("notes-pdfs")
    .upload(pdfPath, pdfBuffer, { contentType: "application/pdf" });

  if (uploadError) {
    return NextResponse.json(
      { error: "Couldn't save the PDF. Please try again." },
      { status: 500 },
    );
  }

  const { data: note, error: insertError } = await admin
    .from("notes")
    .insert({
      user_id: user.id,
      video_title: title,
      video_url: url,
      mode,
      pdf_path: pdfPath,
    })
    .select("id, video_title, video_url, mode")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Couldn't save the note. Please try again." },
      { status: 500 },
    );
  }

  await admin
    .from("usage")
    .upsert(
      { user_id: user.id, date: today, count: usedToday + 1 },
      { onConflict: "user_id,date" },
    );

  return NextResponse.json(note);
}
