// src/components/tasks/ExecutionTraceTask.tsx
//
// Click-based execution-trace builder — no drag-and-drop. All event cards
// start in one "Events" list; clicking a card moves it into the numbered
// "Your execution trace" list, in the order it was clicked. Cards left in
// the "Events" list are never explicitly classified — they're implicitly
// treated as skipped, per the task's own instruction (see each task's
// `question` in content/module1-trace-execution.ts). Removing a traced
// event returns it to the "Events" list; reordering uses plain ▲/▼
// buttons. Every interaction here is a plain, always-visible button, fully
// Tab + Enter/Space operable — nothing depends on drag support at all.

import { useMemo, useState } from "react";
import type { ExecutionTraceData } from "../../types/content";
import { InlineCode } from "../InlineCode";
import { shuffledIds } from "./shuffle";
import styles from "./ExecutionTraceTask.module.css";

export interface ExecutionTraceTaskProps {
  data: ExecutionTraceData;
  onSubmit: (sequence: string[]) => void;
  disabled?: boolean;
}

export function ExecutionTraceTask({ data, onSubmit, disabled }: ExecutionTraceTaskProps) {
  const cardMap = useMemo(() => new Map(data.cards.map((c) => [c.id, c])), [data.cards]);
  // Shuffled display order, same reasoning as every other task here — a
  // learner shouldn't be able to infer anything from how the cards happen
  // to be authored.
  const [availableIds, setAvailableIds] = useState<string[]>(() => shuffledIds(data.cards));
  const [traceIds, setTraceIds] = useState<string[]>([]);

  const locked = Boolean(disabled);

  function addToTrace(id: string) {
    if (locked) return;
    setAvailableIds((prev) => prev.filter((i) => i !== id));
    setTraceIds((prev) => [...prev, id]);
  }

  function removeFromTrace(id: string) {
    if (locked) return;
    setTraceIds((prev) => prev.filter((i) => i !== id));
    setAvailableIds((prev) => [...prev, id]);
  }

  function moveWithinTrace(id: string, direction: -1 | 1) {
    if (locked) return;
    setTraceIds((prev) => {
      const index = prev.indexOf(id);
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Events</h3>
        {availableIds.length === 0 ? (
          <p className={styles.emptyLabel}>Every event has been added to your trace below.</p>
        ) : (
          <ul className={styles.eventList}>
            {availableIds.map((id) => (
              <li key={id}>
                <button type="button" className={styles.eventButton} onClick={() => addToTrace(id)} disabled={locked}>
                  <span className={styles.cardLabel}>
                    <InlineCode text={cardMap.get(id)?.label ?? id} />
                  </span>
                  <span className={styles.addMarker} aria-hidden="true">
                    + Add
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Your execution trace</h3>
        {traceIds.length === 0 ? (
          <p className={styles.emptyLabel}>Click events above to add them here, in the order they happen.</p>
        ) : (
          <ol className={styles.traceList}>
            {traceIds.map((id, index) => (
              <li key={id} className={styles.card}>
                <span className={styles.stepIndex} aria-hidden="true">
                  {index + 1}
                </span>
                <span className={styles.cardLabel}>
                  <InlineCode text={cardMap.get(id)?.label ?? id} />
                </span>
                <div className={styles.cardControls}>
                  <button
                    type="button"
                    onClick={() => moveWithinTrace(id, -1)}
                    disabled={locked || index === 0}
                    aria-label="Move earlier in the sequence"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWithinTrace(id, 1)}
                    disabled={locked || index === traceIds.length - 1}
                    aria-label="Move later in the sequence"
                  >
                    ▼
                  </button>
                  <button type="button" onClick={() => removeFromTrace(id)} disabled={locked}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={locked || traceIds.length === 0}
          onClick={() => onSubmit(traceIds)}
        >
          Check my answer
        </button>
      </div>
    </div>
  );
}
