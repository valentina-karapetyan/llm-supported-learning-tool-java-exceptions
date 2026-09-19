// src/llm/llmSupportService.ts

import type { SupportType, LlmSupportResponse, Task, TaskAnswerData, TaskResponseData } from "../types/content";
import { generateText, isGeminiConfigured } from "./geminiClient";

// Context beyond the task itself (build spec §9/§11): what the learner has
// already done. Optional because AI Support is sometimes opened before a
// submission exists in scope for the caller — every current call site
// (Feedback screens) does have it, but the type doesn't require it.
export interface SupportContext {
  learnerResponse?: TaskResponseData;
  wasCorrect?: boolean;
}

export interface LlmSupportService {
  getSupport(task: Task, supportType: SupportType, context?: SupportContext): Promise<LlmSupportResponse>;
  // Rewrites an already-generated response's content in simpler terms (build
  // spec §10's "Make this explanation simpler" secondary action) — not a 4th
  // independent request type, a transform applied to whichever of the three
  // main responses is currently on screen.
  simplify(task: Task, supportType: SupportType, currentContent: string): Promise<string>;
}

// --- Mock implementation for the prototype ---
// Reads directly from the task's authored supportContent — no network call,
// no latency, no cost. Used whenever Gemini isn't configured, and as the
// live service's own fallback if a request fails.
export const mockLlmSupportService: LlmSupportService = {
  async getSupport(task, supportType) {
    return task.supportContent[supportType];
  },
  async simplify(task) {
    // No live model to actually rewrite the visible text with, so this
    // falls back to the task's own authored "simpler explanation" — still a
    // simpler restatement of the same task's core rule, just not a literal
    // rewrite of whichever specific response was on screen.
    return task.supportContent.simpler_explanation.content;
  },
};

// --- Live Gemini-backed implementation ---
// Gemini only ever rephrases/personalizes the authored supportContent for
// this exact task and support type — it's explicitly told not to introduce
// any Java fact or correctness claim beyond what's already authored, and
// never to grade the learner's answer. `title` and `keyRule` are passed
// through unchanged from the authored content; only the free-form `content`
// prose is regenerated. See README's "Live LLM API integration" section for
// the key-handling tradeoff this relies on.
const SUPPORT_SYSTEM_INSTRUCTION = `You are the AI Support panel inside a Java exception-handling learning tool, responding for one specific task a learner is currently working through. Support comes in three forms — hint, step-by-step walkthrough, similar example — never an open chat, never a grade. ("simpler explanation" is not requested on its own; it only ever rewrites whichever of the three the learner already received.)

Rules you must never break:
- Never state or imply whether the learner's own answer was correct or incorrect beyond what you're explicitly told below — correctness is decided by predefined task logic, never by you.
- Never introduce a Java fact, rule, or claim about this code's behavior beyond what's already in the "authored reference" and "key rule" you are given. Rephrase, personalize to the task's actual code, and elaborate on it — never invent new correctness criteria.
- Stay strictly within the requested support type's role:
  - hint: a small directional nudge. Do not reveal the exact answer. Focus the learner's attention on the relevant code location, exception relationship, handler, or propagation step — not the conclusion.
  - step_by_step: explain the reasoning process that leads to the answer. This is only ever opened after the task's feedback has already been shown, so you may discuss the now-resolved task directly. Keep it tied to the actual code; do not introduce unrelated Java topics.
  - similar_example: invent a new example using different method names, exception names, and context, that preserves the same underlying concept. Do not just restate the current task with renamed variables. Clearly mark it as an illustrative example, not another graded task.
- Keep it concise — a short paragraph, or a few numbered steps.
- Use single \`backticks\` around identifiers, class names, and short code fragments. Never use triple-backtick fenced code blocks (\`\`\`) — for a multi-line code example, just write the lines plainly with normal line breaks, no fence markers.
- Respond with the content only: no title, no markdown headings, no JSON.`;

/** Plain-text description of what the learner actually submitted, for
 *  prompt context only (not shown to the learner) — resolves ids back to
 *  their authored labels the same way AnswerDiff.tsx does per task type. */
function describeLearnerResponse(answer: TaskAnswerData, response: TaskResponseData): string {
  if (answer.type !== response.type) return "(no answer recorded)";
  switch (response.type) {
    case "execution_trace": {
      if (answer.type !== "execution_trace") return "";
      const labelOf = (id: string) => answer.data.cards.find((c) => c.id === id)?.label ?? id;
      return response.sequence.length > 0
        ? `their execution trace, in order: ${response.sequence.map(labelOf).join(" -> ")}`
        : "no events selected at all";
    }
    case "statement_selection": {
      if (answer.type !== "statement_selection") return "";
      const labelOf = (id: string) => answer.data.options.find((o) => o.id === id)?.label ?? id;
      return `selected: ${response.selectedIds.map(labelOf).join(", ") || "(nothing)"}`;
    }
    case "call_chain": {
      if (answer.type !== "call_chain") return "";
      const step = answer.data.steps.find((s) => s.id === response.selectedStepId);
      return `picked handler location: ${step?.methodName ?? response.selectedStepId}`;
    }
    case "catch_order": {
      if (answer.type !== "catch_order") return "";
      const labelOf = (id: string) => answer.data.clauses.find((c) => c.id === id)?.label ?? id;
      return `ordered the catch clauses as: ${response.order.map(labelOf).join(", then ")}`;
    }
    case "single_choice": {
      if (answer.type !== "single_choice") return "";
      const option = answer.data.options.find((o) => o.id === response.selectedOptionId);
      return `picked: ${option?.label ?? response.selectedOptionId}`;
    }
    case "handler_selection": {
      if (answer.type !== "handler_selection") return "";
      const option = answer.data.options.find((o) => o.id === response.selectedOptionId);
      return `picked: ${option?.label ?? response.selectedOptionId}`;
    }
    case "handler_refactoring": {
      if (answer.type !== "handler_refactoring") return "";
      const option = answer.data.options.find((o) => o.id === response.selectedOptionId);
      return `picked: ${option?.label ?? response.selectedOptionId}`;
    }
    default:
      return "";
  }
}

function buildSupportPrompt(task: Task, supportType: SupportType, context: SupportContext | undefined): string {
  const authored = task.supportContent[supportType];

  const hierarchyText = task.hierarchy
    ? `\nException hierarchy for this task (most general first):\n${task.hierarchy
        .map((n) => `${"  ".repeat(n.depth)}${n.label}`)
        .join("\n")}\n`
    : "";

  const callChainText = task.callChainTrail
    ? `\nCall chain for this task: ${task.callChainTrail.map((s) => s.methodName).join(" -> ")}\n`
    : "";

  const learnerAnswerText = context?.learnerResponse
    ? `\nThe learner has already submitted an answer for this task — they ${describeLearnerResponse(task.answer, context.learnerResponse)}. This was ${
        context.wasCorrect ? "correct" : "incorrect"
      }.\n`
    : "";

  return `Support type requested: ${supportType}

Module/task: ${task.moduleId} / "${task.title}"

This task's Java code:
\`\`\`java
${task.code}
\`\`\`
${hierarchyText}${callChainText}
Question posed to the learner: ${task.question}

Misconception this task targets: ${task.misconception}
${task.feedback.keyRule ? `\nKey rule this task teaches (already established — never contradict it): ${task.feedback.keyRule}\n` : ""}${learnerAnswerText}
Authored reference content for this exact support type — rephrase and personalize this, do not contradict or go beyond it:
"""
${authored.content}
"""
${authored.keyRule ? `\nAuthored key rule (only restate verbatim if you reference it, never reword it): "${authored.keyRule}"` : ""}

Write the learner-facing "${supportType}" content now.`;
}

const SIMPLIFY_SYSTEM_INSTRUCTION = `You rewrite an already-generated piece of learner-facing explanation from a Java exception-handling learning tool, making it simpler. You never grade the learner and never introduce a new Java fact or claim beyond what the original text already said.

Rules you must never break:
- Preserve full technical correctness and the central Java rule the original explanation makes — simplify how it's expressed, never drop the rule itself.
- Use shorter sentences and simpler, more everyday terminology.
- Do not add new information, examples, or claims beyond what the original already said.
- Keep it roughly the same length or shorter, never longer.
- Use single \`backticks\` around identifiers, class names, and short code fragments. Never use triple-backtick fenced code blocks (\`\`\`) — for a multi-line code example, just write the lines plainly with normal line breaks, no fence markers.
- Respond with the rewritten content only: no title, no preamble, no markdown headings.`;

function buildSimplifyPrompt(task: Task, supportType: SupportType, currentContent: string): string {
  return `This task's Java code:
\`\`\`java
${task.code}
\`\`\`

The learner just received this "${supportType}" explanation:
"""
${currentContent}
"""

Rewrite it in simpler terms now.`;
}

export const liveLlmSupportService: LlmSupportService = {
  async getSupport(task, supportType, context) {
    const authored = task.supportContent[supportType];
    try {
      const content = await generateText(SUPPORT_SYSTEM_INSTRUCTION, buildSupportPrompt(task, supportType, context));
      return { ...authored, content: content.trim() };
    } catch {
      // Missing key, network error, or a safety-filtered response all fall
      // back to the authored content rather than breaking the panel.
      return authored;
    }
  },
  async simplify(task, supportType, currentContent) {
    try {
      const content = await generateText(SIMPLIFY_SYSTEM_INSTRUCTION, buildSimplifyPrompt(task, supportType, currentContent));
      return content.trim();
    } catch {
      return task.supportContent.simpler_explanation.content;
    }
  },
};

export const llmSupportService: LlmSupportService = isGeminiConfigured() ? liveLlmSupportService : mockLlmSupportService;
