// src/components/CheckedAnswer.tsx
//
// What a task's answer area turns into right after "Check": the learner's
// own answer, locked, in the same visual shape as the task widget they just
// used, with the parts they chose colored green (right) or red (wrong). The
// explanation (FeedbackCard) only follows after "See the explanation" — see
// the "verdict" FeedbackView in screenReducer.ts.
//
// Only what the learner chose is colored; the correct answer itself is left
// for the explanation to show.

import { useEffect, useRef } from "react";
import type { Task, TaskResponseData } from "../types/content";
import { evaluateAnswer } from "../state/evaluateAnswer";
import { InlineCode } from "./InlineCode";
import selection from "./tasks/SelectionTask.module.css";
import styles from "./CheckedAnswer.module.css";

export interface CheckedAnswerProps {
  task: Task;
  response: TaskResponseData;
  onContinue: () => void;
  continueLabel?: string;
}

type Mark = "correct" | "incorrect" | "neutral";

interface Row {
  id: string;
  label: string;
  mark: Mark;
  marker?: string;
  code?: string;
  note?: string;
}

function rowsFor(task: Task, response: TaskResponseData): { rows: Row[]; numbered: boolean } {
  const answer = task.answer;
  const pick = (selected: boolean, right: boolean): Mark => (!selected ? "neutral" : right ? "correct" : "incorrect");

  if (answer.type === "single_choice" && response.type === "single_choice") {
    return {
      numbered: false,
      rows: answer.data.options.map((o) => ({
        id: o.id,
        label: o.label,
        mark: pick(o.id === response.selectedOptionId, o.id === answer.data.correctOptionId),
      })),
    };
  }
  if (answer.type === "handler_selection" && response.type === "handler_selection") {
    return {
      numbered: false,
      rows: answer.data.options.map((o) => {
        const selected = o.id === response.selectedOptionId;
        return {
          id: o.id,
          label: o.label,
          mark: pick(selected, o.isCorrect),
          note: selected ? o.rationale : undefined,
        };
      }),
    };
  }
  if (answer.type === "handler_refactoring" && response.type === "handler_refactoring") {
    return {
      numbered: false,
      rows: answer.data.options.map((o) => ({
        id: o.id,
        label: o.label,
        code: o.code,
        mark: pick(o.id === response.selectedOptionId, o.isCorrect),
      })),
    };
  }
  if (answer.type === "call_chain" && response.type === "call_chain") {
    return {
      numbered: false,
      rows: answer.data.steps.map((s, i) => ({
        id: s.id,
        label: `\`${s.methodName}\``,
        marker: String(i + 1),
        mark: pick(s.id === response.selectedStepId, s.id === answer.data.correctHandlerStepId),
      })),
    };
  }
  if (answer.type === "statement_selection" && response.type === "statement_selection") {
    const correct = new Set(answer.data.correctSelectedIds);
    return {
      numbered: false,
      rows: answer.data.options.map((o) => ({
        id: o.id,
        label: o.label,
        mark: pick(response.selectedIds.includes(o.id), correct.has(o.id)),
      })),
    };
  }
  if (answer.type === "catch_order" && response.type === "catch_order") {
    const labels = new Map(answer.data.clauses.map((c) => [c.id, c.label]));
    return {
      numbered: true,
      rows: response.order.map((id, i) => ({
        id,
        label: labels.get(id) ?? id,
        mark: answer.data.correctOrder[i] === id ? "correct" : "incorrect",
      })),
    };
  }
  if (answer.type === "execution_trace" && response.type === "execution_trace") {
    const labels = new Map(answer.data.cards.map((c) => [c.id, c.label]));
    return {
      numbered: true,
      rows: response.sequence.map((id, i) => ({
        id,
        label: labels.get(id) ?? id,
        mark: answer.data.correctOrder[i] === id ? "correct" : "incorrect",
      })),
    };
  }
  return { numbered: false, rows: [] };
}

const MARK_CLASS: Record<Mark, string> = {
  correct: styles.rowCorrect,
  incorrect: styles.rowIncorrect,
  neutral: styles.rowNeutral,
};

export function CheckedAnswer({ task, response, onContinue, continueLabel = "See the explanation →" }: CheckedAnswerProps) {
  const wasCorrect = evaluateAnswer(task.answer, response);
  const { rows, numbered } = rowsFor(task, response);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus({ preventScroll: true });
  }, []);

  const ListTag = numbered ? "ol" : "ul";

  return (
    <div className={selection.wrapper}>
      {numbered && <h3 className={styles.listTitle}>Your answer</h3>}
      <ListTag className={selection.options}>
        {rows.map((row, i) => (
          <li key={row.id}>
            <div className={[selection.option, styles.row, MARK_CLASS[row.mark]].join(" ")}>
              <span className={[selection.optionMarker, styles.marker].join(" ")} aria-hidden="true">
                {row.mark === "correct" ? "✓" : row.mark === "incorrect" ? "✗" : numbered ? String(i + 1) : (row.marker ?? "")}
              </span>
              <span className={selection.optionBody}>
                <span className={selection.optionLabel}>
                  {numbered && <span className={styles.position}>{i + 1}. </span>}
                  <InlineCode text={row.label} />
                </span>
                {row.code && (
                  <pre className={selection.optionCode}>
                    <code>{row.code}</code>
                  </pre>
                )}
                {row.note && <span className={styles.note}>{row.note}</span>}
              </span>
              {row.mark !== "neutral" && (
                <span className={styles.srOnly}>{row.mark === "correct" ? "correct" : "incorrect"}</span>
              )}
            </div>
          </li>
        ))}
      </ListTag>

      <div className={styles.footer} role="status">
        <span className={[styles.verdict, wasCorrect ? styles.verdictCorrect : styles.verdictIncorrect].join(" ")}>
          {wasCorrect ? "✓ Correct!" : "✗ Not quite"}
        </span>
        <button ref={buttonRef} type="button" className={selection.primaryButton} onClick={onContinue}>
          {continueLabel}
        </button>
      </div>
    </div>
  );
}
