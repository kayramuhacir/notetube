import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please log in again." }, { status: 401 });
  }

  // RLS on this query ensures the note belongs to the requesting user.
  const { data: note } = await supabase
    .from("notes")
    .select("pdf_path")
    .eq("id", id)
    .single();

  if (!note) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("notes-pdfs")
    .createSignedUrl(note.pdf_path, 60);

  if (error || !data) {
    return NextResponse.json(
      { error: "Couldn't generate a download link." },
      { status: 500 },
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
