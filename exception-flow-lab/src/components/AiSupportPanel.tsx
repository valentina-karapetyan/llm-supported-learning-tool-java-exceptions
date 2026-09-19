// src/components/AiSupportPanel.tsx
//
// Screen E (AI Support Panel). Three main, independently-available forms of
// support — hint, step-by-step, similar example — never an open chat, never
// used for correctness grading. They're genuinely different kinds of help,
// not an escalating ladder, so (build spec §10) unlike the panel's original
// four-button version, none of them gates any other: all three are
// available as soon as the panel opens.
//
// "Make this explanation simpler" is a secondary action attached to each
// already-generated response, not a fourth peer button — it rewrites that
// one response's content in place.
//
// Progressive hint fading (build spec §2): if the learner answered the
// last two completed tasks in this module correctly on the first try, the
// panel opens collapsed ("Need help? ▾") instead of expanded. It's a
// nudge, never a lock — every button is still one click away once expanded.

import { useEffect, useState } from "react";
import type { LlmSupportResponse, SupportType, Task } from "../types/content";
import { llmSupportService, type SupportContext } from "../llm/llmSupportService";
import { InlineCode } from "./InlineCode";
import styles from "./AiSupportPanel.module.css";

export interface AiSupportPanelProps {
  task: Task;
  collapsedByDefault: boolean;
  // What was already unlocked on an earlier visit to this task's support
  // panel (from progressStore) — without this, closing and reopening the
  // panel for the same task would silently relock everything and lose the
  // learner's place, even though their progress was already recorded.
  initialRequested: SupportType[];
  // The learner's own submitted answer for this task, if any (build spec
  // §9/§11) — threaded straight into the AI's prompt so it can focus a hint
  // on the actual mistake, discuss the resolved task in a step-by-step
  // walkthrough, etc. Omitted only in the (currently unreachable) case of
  // opening support with nothing submitted yet.
  context?: SupportContext;
  onBack: (requestedInOrder: SupportType[]) => void;
}

type PrimarySupportType = "hint" | "step_by_step" | "similar_example";

const PRIMARY_SUPPORT_TYPES: PrimarySupportType[] = ["hint", "step_by_step", "similar_example"];

const BUTTON_LABEL: Record<PrimarySupportType, string> = {
  hint: "Give me a hint",
  step_by_step: "Explain it step by step",
  similar_example: "Show me a similar example",
};

const SIMPLIFY_LABEL = "Make this explanation simpler";

export function AiSupportPanel({ task, collapsedByDefault, initialRequested, context, onBack }: AiSupportPanelProps) {
  // Already having unlocked buttons from a prior visit implies the panel
  // was expanded then too, regardless of the fading heuristic.
  const [expanded, setExpanded] = useState(!collapsedByDefault || initialRequested.length > 0);
  const [requested, setRequested] = useState<SupportType[]>(initialRequested);
  const [responses, setResponses] = useState<Partial<Record<SupportType, LlmSupportResponse>>>({});
  const [loading, setLoading] = useState<SupportType | null>(null);
  const [simplifying, setSimplifying] = useState<SupportType | null>(null);
  // Types whose visible content has already been simplified once — hides
  // that card's "Make this explanation simpler" action afterward rather
  // than inviting an endless "simpler than simple" loop.
  const [simplified, setSimplified] = useState<Set<SupportType>>(new Set());

  // Re-fetch content for anything already unlocked on a previous visit, so
  // reopening shows it again instead of an unlocked-but-empty button.
  useEffect(() => {
    initialRequested.forEach((type) => {
      llmSupportService.getSupport(task, type, context).then((response) => {
        setResponses((prev) => ({ ...prev, [type]: response }));
      });
    });
    // Intentionally runs once on mount only — initialRequested is a snapshot
    // of progress as of opening the panel, not something to resync on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRequest(type: SupportType) {
    setLoading(type);
    try {
      const response = await llmSupportService.getSupport(task, type, context);
      setResponses((prev) => ({ ...prev, [type]: response }));
      setRequested((prev) => (prev.includes(type) ? prev : [...prev, type]));
    } finally {
      setLoading(null);
    }
  }

  async function handleSimplify(type: SupportType) {
    const current = responses[type];
    if (!current) return;
    setSimplifying(type);
    try {
      const simplerContent = await llmSupportService.simplify(task, type, current.content);
      setResponses((prev) => ({ ...prev, [type]: { ...current, content: simplerContent } }));
      setSimplified((prev) => new Set(prev).add(type));
    } finally {
      setSimplifying(null);
    }
  }

  if (!expanded) {
    return (
      <div className={styles.wrapper}>
        <button type="button" className={styles.collapsedToggle} onClick={() => setExpanded(true)}>
          Need help? ▾
        </button>
        <button type="button" className={styles.backLink} onClick={() => onBack(requested)}>
          ← Back to feedback
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Need more help?</h2>
      <p className={styles.subheading}>Pick whichever would help most right now — never a grade, never an open chat.</p>

      <div className={styles.buttonRow}>
        {PRIMARY_SUPPORT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={[styles.supportButton, requested.includes(type) ? styles.supportButtonUsed : ""].join(" ")}
            disabled={loading === type}
            onClick={() => handleRequest(type)}
          >
            {loading === type ? "Thinking…" : BUTTON_LABEL[type]}
          </button>
        ))}
      </div>

      <div className={styles.responses}>
        {PRIMARY_SUPPORT_TYPES.filter((type) => responses[type]).map((type) => {
          const response = responses[type]!;
          return (
            <div key={type} className={styles.responseCard}>
              <p className={styles.responseTitle}>
                <InlineCode text={response.title} />
              </p>
              <pre className={styles.responseContent}>
                <InlineCode text={response.content} />
              </pre>
              {response.keyRule && (
                <p className={styles.responseKeyRule}>
                  Key rule: <InlineCode text={response.keyRule} />
                </p>
              )}
              {!simplified.has(type) && (
                <button
                  type="button"
                  className={styles.simplifyButton}
                  disabled={simplifying === type}
                  onClick={() => handleSimplify(type)}
                >
                  {simplifying === type ? "Simplifying…" : SIMPLIFY_LABEL}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" className={styles.backLink} onClick={() => onBack(requested)}>
        ← Back to feedback
      </button>
    </div>
  );
}
