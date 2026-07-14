import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-24 pb-20 text-center">
          <p className="mb-4 text-sm font-medium text-indigo-400">
            Any YouTube video, in minutes
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
            Turn YouTube videos into
            <br /> clean study notes
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
            Paste a link, pick a style, and get a structured PDF of notes —
            step-by-step for tutorials, or grouped by topic for a quick
            summary. No re-watching required.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-md bg-indigo-500 px-6 py-3 font-medium text-white hover:bg-indigo-400"
            >
              Get started free
            </Link>
            <Link
              href="/pricing"
              className="rounded-md border border-neutral-700 px-6 py-3 font-medium text-neutral-200 hover:border-neutral-500"
            >
              See pricing
            </Link>
          </div>
          <p className="mt-4 text-sm text-neutral-500">
            1 free PDF a day. No credit card required.
          </p>
        </section>

        <section className="mx-auto max-w-4xl px-6 pb-24">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                title: "1. Paste a link",
                body: "Drop in any YouTube URL with captions available.",
              },
              {
                title: "2. Pick a style",
                body: "Step-by-step with timestamps, or a topic-grouped summary.",
              },
              {
                title: "3. Download the PDF",
                body: "Get a clean, formatted PDF you can keep or print.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6"
              >
                <h3 className="font-medium text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-neutral-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-neutral-800 px-6 py-8 text-center text-sm text-neutral-500">
        NoteTube
      </footer>
    </>
  );
}
