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

import { useState } from "react";
import type { LlmSupportResponse, SupportType, Task } from "../types/content";
import { SUPPORT_TYPE_ORDER } from "../types/content";
import { llmSupportService } from "../llm/llmSupportService";
import styles from "./AiSupportPanel.module.css";

export interface AiSupportPanelProps {
  task: Task;
  collapsedByDefault: boolean;
  onBack: (requestedInOrder: SupportType[]) => void;
}

const BUTTON_LABEL: Record<SupportType, string> = {
  hint: "Hint",
  step_by_step: "Step by step",
  simpler_explanation: "Simpler explanation",
  similar_example: "Similar example",
};

export function AiSupportPanel({ task, collapsedByDefault, onBack }: AiSupportPanelProps) {
  const [expanded, setExpanded] = useState(!collapsedByDefault);
  const [requested, setRequested] = useState<SupportType[]>([]);
  const [responses, setResponses] = useState<Partial<Record<SupportType, LlmSupportResponse>>>({});
  const [loading, setLoading] = useState<SupportType | null>(null);

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
      <p className={styles.subheading}>Four steps, from a light nudge to a worked example — never a grade, never a chat box.</p>

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
              <p className={styles.responseTitle}>{response.title}</p>
              <pre className={styles.responseContent}>{response.content}</pre>
              {response.keyRule && <p className={styles.responseKeyRule}>Key rule: {response.keyRule}</p>}
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
