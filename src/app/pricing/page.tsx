import Navbar from "@/components/Navbar";
import UpgradeButton from "@/components/UpgradeButton";
import { createClient } from "@/lib/supabase/server";

export default async function PricingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isPremium = false;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("is_premium")
      .eq("id", user.id)
      .single();
    isPremium = profile?.is_premium ?? false;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center px-6 py-16">
        <h1 className="text-3xl font-semibold text-white">Pricing</h1>
        <p className="mt-2 text-neutral-400">Simple, no surprises.</p>

        <div className="mt-10 grid w-full gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-6">
            <h2 className="text-lg font-medium text-white">Free</h2>
            <p className="text-3xl font-semibold text-white">
              $0<span className="text-base font-normal text-neutral-500">/mo</span>
            </p>
            <ul className="flex-1 space-y-2 text-sm text-neutral-400">
              <li>1 PDF per day</li>
              <li>Step-by-step or summary notes</li>
              <li>Download anytime</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 rounded-lg border border-indigo-500 bg-indigo-500/5 p-6">
            <h2 className="text-lg font-medium text-white">Premium</h2>
            <p className="text-3xl font-semibold text-white">
              $9<span className="text-base font-normal text-neutral-500">/mo</span>
            </p>
            <ul className="flex-1 space-y-2 text-sm text-neutral-400">
              <li>Unlimited PDFs</li>
              <li>Step-by-step or summary notes</li>
              <li>Priority generation</li>
            </ul>
            {isPremium ? (
              <button
                disabled
                className="w-full rounded-md border border-neutral-700 py-2.5 font-medium text-neutral-400"
              >
                Current plan
              </button>
            ) : (
              <UpgradeButton loggedIn={!!user} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
