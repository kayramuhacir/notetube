import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
      <Link href="/" className="font-semibold text-lg tracking-tight">
        Note<span className="text-indigo-400">Tube</span>
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/dashboard" className="text-neutral-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-neutral-300 hover:text-white">
              Pricing
            </Link>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/pricing" className="text-neutral-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/login" className="text-neutral-300 hover:text-white">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-400"
            >
              Sign up free
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
