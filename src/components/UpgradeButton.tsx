"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpgradeButton({ loggedIn }: { loggedIn: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleClick() {
    if (!loggedIn) {
      router.push("/signup");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Couldn't start checkout. Please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-md bg-indigo-500 py-2.5 font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
      >
        {loading ? "Redirecting..." : "Upgrade to Premium"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
