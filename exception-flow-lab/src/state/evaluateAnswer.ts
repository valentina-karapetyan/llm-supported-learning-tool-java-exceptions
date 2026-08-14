// src/state/evaluateAnswer.ts
//
// Correctness checking, kept as one small pure function so TaskRenderer's
// per-type components stay dumb (they just report what the learner picked)
// and every task type is judged the same way regardless of which screen
// triggers it (diagnostic, transfer, retry).

import type { TaskAnswerData, TaskResponseData } from "../types/content";

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function setsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((v) => setA.has(v));
}

export function evaluateAnswer(answer: TaskAnswerData, response: TaskResponseData): boolean {
  if (answer.type !== response.type) return false;

  switch (response.type) {
    case "execution_trace":
      return answer.type === "execution_trace" && arraysEqual(answer.data.correctOrder, response.sequence);
    case "statement_selection":
      return answer.type === "statement_selection" && setsEqual(answer.data.correctSelectedIds, response.selectedIds);
    case "call_chain":
      return answer.type === "call_chain" && answer.data.correctHandlerStepId === response.selectedStepId;
    case "catch_order":
      return answer.type === "catch_order" && arraysEqual(answer.data.correctOrder, response.order);
    case "handler_selection": {
      if (answer.type !== "handler_selection") return false;
      const option = answer.data.options.find((o) => o.id === response.selectedOptionId);
      return Boolean(option?.isCorrect);
    }
    case "handler_refactoring": {
      if (answer.type !== "handler_refactoring") return false;
      const option = answer.data.options.find((o) => o.id === response.selectedOptionId);
      return Boolean(option?.isCorrect);
    }
    default:
      return false;
  }
}
