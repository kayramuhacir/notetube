"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  canGenerate: boolean;
}

export default function NoteForm({ canGenerate }: Props) {
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"steps" | "summary">("steps");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeNeeded, setUpgradeNeeded] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUpgradeNeeded(false);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.upgradeNeeded) {
          setUpgradeNeeded(true);
        }
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setUrl("");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-6"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-neutral-300">
          YouTube link
        </label>
        <input
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-white placeholder-neutral-500 outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-neutral-300">
          Note style
        </span>
        <div className="flex gap-2">
          {(
            [
              { value: "steps", label: "Step-by-step" },
              { value: "summary", label: "Summary" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMode(opt.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium border ${
                mode === opt.value
                  ? "border-indigo-400 bg-indigo-500/10 text-indigo-300"
                  : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
          {upgradeNeeded && (
            <>
              {" "}
              <Link href="/pricing" className="underline">
                Upgrade to Premium
              </Link>
            </>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !canGenerate}
        className="rounded-md bg-indigo-500 py-2.5 font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
      >
        {loading
          ? "Generating notes..."
          : canGenerate
            ? "Generate PDF"
            : "Daily limit reached"}
      </button>
    </form>
  );
}
