import Anthropic from "@anthropic-ai/sdk";
import type { TranscriptSegment } from "@/lib/youtube";
import { formatTimestamp } from "@/lib/youtube";

export type NoteMode = "steps" | "summary";

export interface NoteSection {
  heading: string;
  timestamp?: string;
  bullets: string[];
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STEPS_INSTRUCTIONS = `Produce numbered, step-by-step notes tied to timestamps - ideal for a tutorial. Each step should be one section. Give each step a short imperative heading (e.g. "Install the dependency") and its approximate timestamp, then 1-4 bullets of detail under it. Preserve the order of the video.`;

const SUMMARY_INSTRUCTIONS = `Produce notes summarized and grouped by topic, not by timestamp order. Merge related points from across the video into coherent topic sections. Do not include timestamps. Give each topic a short heading, then 2-5 bullets covering the key points.`;

export async function generateNotes(
  title: string,
  segments: TranscriptSegment[],
  mode: NoteMode,
): Promise<NoteSection[]> {
  const transcriptText = segments
    .map((s) => `[${formatTimestamp(s.offsetSeconds)}] ${s.text}`)
    .join("\n");

  const instructions = mode === "steps" ? STEPS_INSTRUCTIONS : SUMMARY_INSTRUCTIONS;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4096,
    system:
      "You turn YouTube video transcripts into clean, structured study notes. Respond with ONLY valid JSON, no markdown fences, no commentary.",
    messages: [
      {
        role: "user",
        content: `Video title: "${title}"

${instructions}

Return JSON matching this exact TypeScript type:
{ "sections": { "heading": string, "timestamp"?: string, "bullets": string[] }[] }

Transcript (timestamps in [mm:ss]):
${transcriptText}`,
      },
    ],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content.");
  }

  let parsed: { sections: NoteSection[] };
  try {
    const jsonText = block.text.trim().replace(/^```json\s*|```$/g, "");
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error("Couldn't parse the generated notes. Please try again.");
  }

  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error("The model didn't return any notes for this video.");
  }

  return parsed.sections;
}
