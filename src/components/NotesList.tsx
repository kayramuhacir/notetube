"use client";

import { useState } from "react";

export interface NoteRow {
  id: string;
  video_title: string;
  video_url: string;
  mode: "steps" | "summary";
  created_at: string;
}

export default function NotesList({ notes }: { notes: NoteRow[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(id: string) {
    setDownloadingId(id);
    try {
      const res = await fetch(`/api/notes/${id}/download`);
      const data = await res.json();
      if (res.ok && data.url) {
        window.open(data.url, "_blank");
      }
    } finally {
      setDownloadingId(null);
    }
  }

  if (notes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No notes yet — generate your first PDF above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-neutral-800">
      {notes.map((note) => (
        <li
          key={note.id}
          className="flex items-center justify-between gap-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-200">
              {note.video_title}
            </p>
            <p className="text-xs text-neutral-500">
              {note.mode === "steps" ? "Step-by-step" : "Summary"} ·{" "}
              {new Date(note.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={() => handleDownload(note.id)}
            disabled={downloadingId === note.id}
            className="shrink-0 rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 hover:border-neutral-500 disabled:opacity-50"
          >
            {downloadingId === note.id ? "Loading..." : "Download"}
          </button>
        </li>
      ))}
    </ul>
  );
}
