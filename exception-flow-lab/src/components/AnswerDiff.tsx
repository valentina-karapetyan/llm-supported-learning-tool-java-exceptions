// src/components/AnswerDiff.tsx
//
// Shown on the Feedback screen when the answer was wrong: makes the actual
// mistake in the *structured* answer visible (which cards were mis-sorted,
// mis-selected, etc.) — as opposed to grading anything the learner wrote.
// This exists precisely because "wrong" alone wasn't informative enough:
// a learner can write a perfectly correct one-sentence explanation and
// still have mis-sorted the drag task, and without this they had no way
// to see *what* about their structured answer was off.
//
// Exhaustively switches on answer.type, same pattern as TaskRenderer.

import type { TaskAnswerData, TaskResponseData } from "../types/content";
import { InlineCode } from "./InlineCode";
import styles from "./AnswerDiff.module.css";

export interface AnswerDiffProps {
  answer: TaskAnswerData;
  response: TaskResponseData;
}

export function AnswerDiff({ answer, response }: AnswerDiffProps) {
  if (answer.type !== response.type) return null;

  switch (answer.type) {
    case "execution_trace": {
      if (response.type !== "execution_trace") return null;
      const labelOf = (id: string) => answer.data.cards.find((c) => c.id === id)?.label ?? id;
      return <ExecutionTraceDiff correctOrder={answer.data.correctOrder} yourSequence={response.sequence} labelOf={labelOf} />;
    }

    case "catch_order": {
      if (response.type !== "catch_order") return null;
      const labelOf = (id: string) => answer.data.clauses.find((c) => c.id === id)?.label ?? id;
      return <OrderDiff correctIds={answer.data.correctOrder} yourIds={response.order} labelOf={labelOf} />;
    }

    case "statement_selection": {
      if (response.type !== "statement_selection") return null;
      const labelOf = (id: string) => answer.data.options.find((o) => o.id === id)?.label ?? id;
      return (
        <SetDiff
          correctIds={answer.data.correctSelectedIds}
          yourIds={response.selectedIds}
          labelOf={labelOf}
          missingHint="These statements do execute, but you didn't select them:"
          extraHint="You selected these, but they don't execute:"
        />
      );
    }

    case "call_chain": {
      if (response.type !== "call_chain") return null;
      const step = answer.data.steps.find((s) => s.id === response.selectedStepId);
      const correctStep = answer.data.steps.find((s) => s.id === answer.data.correctHandlerStepId);
      return (
        <SingleChoiceDiff yourLabel={step?.methodName ?? response.selectedStepId} correctLabel={correctStep?.methodName ?? "?"} />
      );
    }

    case "single_choice": {
      if (response.type !== "single_choice") return null;
      const yourOption = answer.data.options.find((o) => o.id === response.selectedOptionId);
      const correctOption = answer.data.options.find((o) => o.id === answer.data.correctOptionId);
      return (
        <SingleChoiceDiff yourLabel={yourOption?.label ?? response.selectedOptionId} correctLabel={correctOption?.label ?? "?"} />
      );
    }

    case "handler_selection": {
      if (response.type !== "handler_selection") return null;
      const yourOption = answer.data.options.find((o) => o.id === response.selectedOptionId);
      const correctOption = answer.data.options.find((o) => o.isCorrect);
      return (
        <SingleChoiceDiff yourLabel={yourOption?.label ?? response.selectedOptionId} correctLabel={correctOption?.label ?? "?"} />
      );
    }

    case "handler_refactoring": {
      if (response.type !== "handler_refactoring") return null;
      const yourOption = answer.data.options.find((o) => o.id === response.selectedOptionId);
      const correctOption = answer.data.options.find((o) => o.isCorrect);
      return (
        <SingleChoiceDiff yourLabel={yourOption?.label ?? response.selectedOptionId} correctLabel={correctOption?.label ?? "?"} />
      );
    }

    default:
      return null;
  }
}

// --- Shared diff shapes ---

interface LabeledListProps {
  title: string;
  ids: string[];
  labelOf: (id: string) => string;
  matchAt?: (index: number, id: string) => boolean; // when given, marks each row ✓/✗
}

function LabeledList({ title, ids, labelOf, matchAt }: LabeledListProps) {
  return (
    <div className={styles.column}>
      <p className={styles.columnTitle}>{title}</p>
      {ids.length === 0 ? (
        <p className={styles.empty}>(nothing)</p>
      ) : (
        <ol className={styles.list}>
          {ids.map((id, index) => {
            const isMatch = matchAt?.(index, id);
            return (
              <li key={`${id}-${index}`} className={[styles.row, matchAt ? (isMatch ? styles.rowMatch : styles.rowMismatch) : ""].join(" ")}>
                {matchAt && <span className={styles.rowMark}>{isMatch ? "✓" : "✗"}</span>}
                <span>
                  <InlineCode text={labelOf(id)} />
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

// Dedicated to execution_trace: shows the correct execution trace next to
// the learner's own submitted trace (marked up ✓/✗ position by position),
// then calls out exactly what was off — events incorrectly included (in
// the learner's trace but not the correct one), events incorrectly omitted
// (in the correct trace but missing from the learner's), or — if the set of
// events was right — just the order. Never shows "(nothing)" for the
// learner's trace unless they truly selected zero events.
function ExecutionTraceDiff({
  correctOrder,
  yourSequence,
  labelOf,
}: {
  correctOrder: string[];
  yourSequence: string[];
  labelOf: (id: string) => string;
}) {
  const missing = correctOrder.filter((id) => !yourSequence.includes(id));
  const extra = yourSequence.filter((id) => !correctOrder.includes(id));
  const rightSetWrongOrder =
    missing.length === 0 && extra.length === 0 && !correctOrder.every((id, i) => yourSequence[i] === id);

  return (
    <div className={styles.wrapper}>
      <div className={styles.columns}>
        <LabeledList title="Correct execution trace" ids={correctOrder} labelOf={labelOf} />

        <div className={styles.column}>
          <p className={styles.columnTitle}>Your execution trace</p>
          {yourSequence.length === 0 ? (
            <p className={styles.empty}>(nothing, you didn't select any event)</p>
          ) : (
            <ol className={styles.list}>
              {yourSequence.map((id, index) => {
                const isMatch = correctOrder[index] === id;
                return (
                  <li key={`${id}-${index}`} className={[styles.row, isMatch ? styles.rowMatch : styles.rowMismatch].join(" ")}>
                    <span className={styles.rowMark}>{isMatch ? "✓" : "✗"}</span>
                    <span>
                      <InlineCode text={labelOf(id)} />
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      {extra.length > 0 && (
        <DiffHint hint="Incorrectly included: you selected these, but they don't actually happen:" ids={extra} labelOf={labelOf} />
      )}
      {missing.length > 0 && (
        <DiffHint hint="Incorrectly omitted: you left these out, but they do happen:" ids={missing} labelOf={labelOf} />
      )}
      {rightSetWrongOrder && (
        <p className={styles.orderHint}>You had the right events, just not in the right order. Compare the positions above.</p>
      )}
    </div>
  );
}

function OrderDiff({ correctIds, yourIds, labelOf }: { correctIds: string[]; yourIds: string[]; labelOf: (id: string) => string }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.columns}>
        <LabeledList title="Correct order" ids={correctIds} labelOf={labelOf} />
        <LabeledList title="Your order" ids={yourIds} labelOf={labelOf} matchAt={(index, id) => correctIds[index] === id} />
      </div>
    </div>
  );
}

function SetDiff({
  correctIds,
  yourIds,
  labelOf,
  missingHint,
  extraHint,
}: {
  correctIds: string[];
  yourIds: string[];
  labelOf: (id: string) => string;
  missingHint: string;
  extraHint: string;
}) {
  const missing = correctIds.filter((id) => !yourIds.includes(id));
  const extra = yourIds.filter((id) => !correctIds.includes(id));
  if (missing.length === 0 && extra.length === 0) return null;
  return (
    <div className={styles.wrapper}>
      {missing.length > 0 && <DiffHint hint={missingHint} ids={missing} labelOf={labelOf} />}
      {extra.length > 0 && <DiffHint hint={extraHint} ids={extra} labelOf={labelOf} />}
    </div>
  );
}

function SingleChoiceDiff({ yourLabel, correctLabel }: { yourLabel: string; correctLabel: string }) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.singleLine}>
        <span className={styles.rowMismatch}>✗ You picked:</span> <InlineCode text={yourLabel} />
      </p>
      <p className={styles.singleLine}>
        <span className={styles.rowMatch}>✓ Correct answer:</span> <InlineCode text={correctLabel} />
      </p>
    </div>
  );
}

function DiffHint({ hint, ids, labelOf }: { hint: string; ids: string[]; labelOf: (id: string) => string }) {
  return (
    <div className={styles.hint}>
      <p className={styles.hintText}>{hint}</p>
      <ul className={styles.hintList}>
        {ids.map((id) => (
          <li key={id}>
            <InlineCode text={labelOf(id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
