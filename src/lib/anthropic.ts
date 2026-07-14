import Anthropic from "@anthropic-ai/sdk";
import type { TranscriptSegment } from "@/lib/youtube";
import { formatTimestamp } from "@/lib/youtube";

export type NoteMode = "steps" | "summary" | "study" | "transcript";

export interface PracticeQuestion {
  type: "short" | "mc";
  question: string;
  options?: string[];
  answer: string;
}

export interface NoteSection {
  heading: string;
  timestamp?: string;
  bullets: string[];
  questions?: PracticeQuestion[];
  breakable?: boolean;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const STEPS_INSTRUCTIONS = `Produce numbered, step-by-step notes tied to timestamps - ideal for a tutorial. Each step should be one section. Give each step a short imperative heading (e.g. "Install the dependency") and its approximate timestamp, then 1-4 bullets of detail under it. Preserve the order of the video.`;

const SUMMARY_INSTRUCTIONS = `Produce notes summarized and grouped by topic, not by timestamp order. Merge related points from across the video into coherent topic sections. Do not include timestamps. Give each topic a short heading, then 2-5 bullets covering the key points.`;

const STUDY_INSTRUCTIONS = `Produce study notes grouped by topic, ideal for learning and reviewing the material. Give each topic a short heading and 2-5 bullets covering the key points, no timestamps. Then, for EVERY section, add 2-4 practice questions that test understanding of that section's material - use a mix of short-answer questions (type "short", open-ended, testing recall/explanation) and multiple-choice questions (type "mc", with 3-4 options). Every question must include an "answer": for "short" questions this is a model/suggested answer (a few sentences); for "mc" questions this is the exact text of the correct option (must match one of the "options" strings exactly).`;

const JSON_SHAPE_BASE = `{ "sections": { "heading": string, "timestamp"?: string, "bullets": string[] }[] }`;

const JSON_SHAPE_STUDY = `{ "sections": { "heading": string, "bullets": string[], "questions": { "type": "short" | "mc", "question": string, "options"?: string[], "answer": string }[] }[] }`;

export function buildTranscriptSections(
  segments: TranscriptSegment[],
  chunkSeconds = 120,
): NoteSection[] {
  const sections: NoteSection[] = [];
  let chunkStart = segments[0]?.offsetSeconds ?? 0;
  let chunkEnd = chunkStart;
  let lines: string[] = [];

  for (const segment of segments) {
    if (
      lines.length > 0 &&
      segment.offsetSeconds - chunkStart >= chunkSeconds
    ) {
      sections.push({
        heading: `${formatTimestamp(chunkStart)} - ${formatTimestamp(chunkEnd)}`,
        bullets: [lines.join(" ")],
        breakable: true,
      });
      chunkStart = segment.offsetSeconds;
      lines = [];
    }
    chunkEnd = segment.offsetSeconds;
    lines.push(segment.text);
  }

  if (lines.length > 0) {
    sections.push({
      heading: `${formatTimestamp(chunkStart)} - ${formatTimestamp(chunkEnd)}`,
      bullets: [lines.join(" ")],
      breakable: true,
    });
  }

  return sections;
}

export async function generateNotes(
  title: string,
  segments: TranscriptSegment[],
  mode: NoteMode,
): Promise<NoteSection[]> {
  if (mode === "transcript") {
    return buildTranscriptSections(segments);
  }

  const transcriptText = segments
    .map((s) => `[${formatTimestamp(s.offsetSeconds)}] ${s.text}`)
    .join("\n");

  const instructions =
    mode === "steps"
      ? STEPS_INSTRUCTIONS
      : mode === "study"
        ? STUDY_INSTRUCTIONS
        : SUMMARY_INSTRUCTIONS;

  const jsonShape = mode === "study" ? JSON_SHAPE_STUDY : JSON_SHAPE_BASE;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: mode === "study" ? 8192 : 4096,
    system:
      "You turn YouTube video transcripts into clean, structured study notes. Write the notes in the same language as the transcript (e.g. a Farsi transcript gets Farsi notes) - do not translate to English unless the transcript itself is in English. Respond with ONLY valid JSON, no markdown fences, no commentary.",
    messages: [
      {
        role: "user",
        content: `Video title: "${title}"

${instructions}

Return JSON matching this exact TypeScript type:
${jsonShape}

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
    if (message.stop_reason === "max_tokens") {
      throw new Error(
        "This video is too long to generate notes for in this mode. Try a shorter video.",
      );
    }
    throw new Error("Couldn't parse the generated notes. Please try again.");
  }

  if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
    throw new Error("The model didn't return any notes for this video.");
  }

  return parsed.sections;
}
