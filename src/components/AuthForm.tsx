"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const { data, error } =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (mode === "signup" && !data.session) {
      setInfo("Check your email to confirm your account, then log in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-24">
      <h1 className="text-2xl font-semibold text-white">
        {mode === "signup" ? "Create your account" : "Log in"}
      </h1>

      <button
        type="button"
        disabled
        title="Google sign-in is coming soon"
        className="cursor-not-allowed rounded-md border border-neutral-800 py-2.5 font-medium text-neutral-500"
      >
        Continue with Google (coming soon)
      </button>

      <div className="flex items-center gap-3 text-xs text-neutral-500">
        <div className="h-px flex-1 bg-neutral-800" />
        OR
        <div className="h-px flex-1 bg-neutral-800" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-indigo-400"
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-indigo-400"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-md bg-indigo-500 py-2.5 font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : mode === "signup"
              ? "Sign up"
              : "Log in"}
        </button>
      </form>

      <p className="text-sm text-neutral-500">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-indigo-400 hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/signup" className="text-indigo-400 hover:underline">
              Sign up
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
