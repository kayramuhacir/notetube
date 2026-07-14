import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import NoteForm from "@/components/NoteForm";
import NotesList, { type NoteRow } from "@/components/NotesList";
import { createClient } from "@/lib/supabase/server";

const FREE_DAILY_LIMIT = 1;

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: profile }, { data: usage }, { data: notes }] = await Promise.all([
    supabase.from("users").select("is_premium").eq("id", user.id).single(),
    supabase
      .from("usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("notes")
      .select("id, video_title, video_url, mode, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const isPremium = profile?.is_premium ?? false;
  const usedToday = usage?.count ?? 0;
  const canGenerate = isPremium || usedToday < FREE_DAILY_LIMIT;

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {isPremium ? (
              "Unlimited PDFs (Premium)"
            ) : (
              <>
                {usedToday}/{FREE_DAILY_LIMIT} free notes used today.{" "}
                <Link href="/pricing" className="text-indigo-400 hover:underline">
                  Upgrade to Premium
                </Link>{" "}
                for unlimited PDFs.
              </>
            )}
          </p>
        </div>

        <NoteForm canGenerate={canGenerate} />

        <div>
          <h2 className="mb-3 text-sm font-medium text-neutral-300">
            Past notes
          </h2>
          <NotesList notes={(notes as NoteRow[] | null) ?? []} />
        </div>
      </main>
    </>
  );
}
