// src/llm/retrievalComparisonService.ts
//
// Mirrors llmSupportService.ts's shape: an interface first, a placeholder
// implementation used whenever Gemini isn't configured, and a live
// Gemini-backed implementation.
//
// The live implementation sends the learner's free-text answer plus this
// question's predefined referenceAnswer/requiredConcepts/commonMisconceptions
// (see RetrievalQuestion in types/content.ts) to Gemini, constrained to
// return JSON matching RetrievalComparisonResult. The LLM only ever compares
// and explains — it's explicitly told not to invent correctness criteria or
// decide what the learner was supposed to learn; every field it reasons over
// is already authored in content/retrievalQuestions.ts, never inferred. It
// never assigns a grade, score, or pass/fail verdict (build spec §12) — see
// RetrievalComparisonResult's own doc comment in types/content.ts.

import type { RetrievalComparisonResult, RetrievalQuestion } from "../types/content";
import { generateJson, isGeminiConfigured } from "./geminiClient";

// Distinguishes "nothing to show because no key is configured" (expected,
// silent, renders the existing placeholder card) from "a live request was
// actually attempted and failed" (build spec §13 — must surface a real
// error state, never look like the same thing as "AI feedback is off").
export type RetrievalCheckOutcome =
  | { status: "ok"; result: RetrievalComparisonResult }
  | { status: "unavailable" }
  | { status: "error" };

export interface RetrievalComparisonService {
  compare(retrievalQuestion: RetrievalQuestion, learnerAnswer: string): Promise<RetrievalCheckOutcome>;
}

// --- Placeholder for the prototype ---
// Never evaluates the learner's answer. Used whenever Gemini isn't
// configured — RetrievalPractice.tsx renders its static "AI-supported
// feedback placeholder" card for this status, same as before this was
// wired up to a real model.
export const placeholderRetrievalComparisonService: RetrievalComparisonService = {
  async compare() {
    return { status: "unavailable" };
  },
};

// --- Live Gemini-backed implementation ---
const RETRIEVAL_SYSTEM_INSTRUCTION = `You give a learner formative feedback on a free-text explanation for one retrieval-practice question in a Java exception-handling learning tool. You compare their answer against predefined reference material — you never invent what counts as correct and never decide what the learner was supposed to learn; that's fixed entirely by the "requiredConcepts" and "commonMisconceptions" given to you, and by nothing else. You never assign a grade, score, percentage, or overall pass/fail judgment.

Rules you must never break:
- "criteria" must contain exactly one entry per item in the given "requiredConcepts" list, in the same order, each with that concept copied verbatim into "concept". Never add, split, merge, or invent a concept that isn't in that list.
- "status" is "addressed" (clearly demonstrated), "partly_addressed" (gestured at but incomplete or vague), or "missing" (not present at all). Judge substance, not wording — the learner doesn't need to match the reference answer's phrasing, only demonstrate the same understanding.
- "feedback" is one short, natural sentence about THIS concept, written directly to the learner:
  - "addressed": briefly acknowledge what they got right, in your own words — don't quote their answer back at length.
  - "partly_addressed": say what they already got right, then what's still incomplete, e.g. "You correctly mention that the exception continues to the caller. Also explain that this continues through the active call chain until a compatible handler is found."
  - "missing": explain the idea itself in plain, learner-facing language — teach it, don't just flag its absence.
  - Never write the bare word "Missing", "Addressed", "Partly addressed", or any other internal status label inside this text.
- "inaccuracies" contains one entry for each item in the given "commonMisconceptions" list that the learner's answer actually shows signs of (empty array if none apply): "idea" copied verbatim from that list, "correction" a short, non-accusatory explanation of what's actually true, connected to what the learner specifically wrote. Never add a misconception that isn't in the given list, never paraphrase "idea".
- "overallFeedback" is one short (1-2 sentence) reaction to THIS specific answer. Summarize, never grade — no scores, percentages, or phrases like "mostly correct" or "7/10".
- "revisionFocus" is either: empty string "" if every required concept is "addressed" and no inaccuracy was detected (do NOT invent an improvement just because the field exists), or one short, concrete instruction naming the single most important thing to add or fix next — never a full model answer, never a restatement of what's already covered.
- Only ever draw on the given "requiredConcepts" and "commonMisconceptions" — never introduce an additional required idea of your own, even if it would be true.`;

const RETRIEVAL_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    criteria: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          concept: { type: "STRING" },
          status: { type: "STRING", enum: ["addressed", "partly_addressed", "missing"] },
          feedback: { type: "STRING" },
        },
        required: ["concept", "status", "feedback"],
      },
    },
    inaccuracies: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          idea: { type: "STRING" },
          correction: { type: "STRING" },
        },
        required: ["idea", "correction"],
      },
    },
    overallFeedback: { type: "STRING" },
    revisionFocus: { type: "STRING" },
  },
  required: ["criteria", "inaccuracies", "overallFeedback", "revisionFocus"],
};

// Richer than the old rubric-row shape (short per-concept sentences plus a
// couple of free-text fields), so this needs more headroom than the 400
// tokens the previous schema used — still a hard cap well below the AI
// Support panel's free prose, so a verbose response gets truncated rather
// than silently costing more than this feature needs.
const RETRIEVAL_MAX_OUTPUT_TOKENS = 700;

function buildRetrievalPrompt(question: RetrievalQuestion, learnerAnswer: string): string {
  return `Question posed to the learner: ${question.question}

Reference answer (never shown to the learner): ${question.referenceAnswer}

Required concepts the learner's answer should demonstrate (already trimmed to what's essential — don't penalize the answer for omitting other true but non-essential ideas):
${question.requiredConcepts.map((concept) => `- ${concept}`).join("\n")}

Common misconceptions to check for:
${question.commonMisconceptions.length > 0 ? question.commonMisconceptions.map((m) => `- ${m}`).join("\n") : "(none authored for this question)"}

Learner's answer:
"""
${learnerAnswer}
"""

Give feedback on the learner's answer against the reference material above and return the JSON result.`;
}

export const liveRetrievalComparisonService: RetrievalComparisonService = {
  async compare(retrievalQuestion, learnerAnswer) {
    try {
      const result = await generateJson<RetrievalComparisonResult>(
        RETRIEVAL_SYSTEM_INSTRUCTION,
        buildRetrievalPrompt(retrievalQuestion, learnerAnswer),
        RETRIEVAL_RESPONSE_SCHEMA,
        RETRIEVAL_MAX_OUTPUT_TOKENS
      );
      return { status: "ok", result };
    } catch {
      // Timeout, network error, exhausted retries, an empty/safety-filtered/
      // token-truncated response, or malformed JSON all land here — every
      // one of them is "a live request was attempted and failed", which the
      // UI must show as a real, actionable error rather than silently
      // reusing the "not configured" placeholder.
      return { status: "error" };
    }
  },
};

export const retrievalComparisonService: RetrievalComparisonService = isGeminiConfigured()
  ? liveRetrievalComparisonService
  : placeholderRetrievalComparisonService;
