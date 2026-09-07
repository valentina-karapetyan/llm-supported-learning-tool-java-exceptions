// src/components/AiSupportPanel.tsx
//
// Screen E (AI Support Panel). Four fixed, sequential buttons — never an
// open chat box, never used for correctness grading. Buttons unlock in
// order (hint → step-by-step → simpler explanation → similar example).
//
// Progressive hint fading (build spec §2): if the learner answered the
// last two completed tasks in this module correctly on the first try, the
// panel opens collapsed ("Need help? ▾") instead of expanded. It's a
// nudge, never a lock — every button is still one click away once expanded.

import { useEffect, useState } from "react";
import type { LlmSupportResponse, SupportType, Task } from "../types/content";
import { SUPPORT_TYPE_ORDER } from "../types/content";
import { llmSupportService } from "../llm/llmSupportService";
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
  onBack: (requestedInOrder: SupportType[]) => void;
}

const BUTTON_LABEL: Record<SupportType, string> = {
  hint: "Hint",
  step_by_step: "Step by step",
  simpler_explanation: "Simpler explanation",
  similar_example: "Similar example",
};

export function AiSupportPanel({ task, collapsedByDefault, initialRequested, onBack }: AiSupportPanelProps) {
  // Already having unlocked buttons from a prior visit implies the panel
  // was expanded then too, regardless of the fading heuristic.
  const [expanded, setExpanded] = useState(!collapsedByDefault || initialRequested.length > 0);
  const [requested, setRequested] = useState<SupportType[]>(initialRequested);
  const [responses, setResponses] = useState<Partial<Record<SupportType, LlmSupportResponse>>>({});
  const [loading, setLoading] = useState<SupportType | null>(null);

  // Re-fetch content for anything already unlocked on a previous visit, so
  // reopening shows it again instead of an unlocked-but-empty button.
  useEffect(() => {
    initialRequested.forEach((type) => {
      llmSupportService.getSupport(task, type).then((response) => {
        setResponses((prev) => ({ ...prev, [type]: response }));
      });
    });
    // Intentionally runs once on mount only — initialRequested is a snapshot
    // of progress as of opening the panel, not something to resync on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function isUnlocked(index: number): boolean {
    if (index === 0) return true;
    return requested.includes(SUPPORT_TYPE_ORDER[index - 1]);
  }

  async function handleRequest(type: SupportType) {
    setLoading(type);
    try {
      const response = await llmSupportService.getSupport(task, type);
      setResponses((prev) => ({ ...prev, [type]: response }));
      setRequested((prev) => (prev.includes(type) ? prev : [...prev, type]));
    } finally {
      setLoading(null);
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
      <h2 className={styles.heading}>AI support</h2>
      <p className={styles.subheading}>Four steps, from a light nudge to a worked example: never a grade, never a chat box.</p>

      <div className={styles.buttonRow}>
        {SUPPORT_TYPE_ORDER.map((type, index) => (
          <button
            key={type}
            type="button"
            className={[styles.supportButton, requested.includes(type) ? styles.supportButtonUsed : ""].join(" ")}
            disabled={!isUnlocked(index) || loading === type}
            onClick={() => handleRequest(type)}
          >
            {loading === type ? "Thinking…" : BUTTON_LABEL[type]}
          </button>
        ))}
      </div>

      <div className={styles.responses}>
        {SUPPORT_TYPE_ORDER.filter((type) => responses[type]).map((type) => {
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
