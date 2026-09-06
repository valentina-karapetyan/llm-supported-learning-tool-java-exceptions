// src/state/screenReducer.ts
//
// Top-level screen state machine for App.tsx. Encodes the flow the build
// spec calls out as the thing that must work end-to-end before anything
// else: diagnostic task → feedback → (optional) AI support → transfer task
// → (optional retry, once) → retrieval practice → module completion.
// Concept Journal is reachable as a side screen, not part of that linear
// flow.
//
// Module 5 (mixed practice) runs a second, shorter flow alongside it:
// case → feedback → (optional AI support) → next case → … → retrieval
// practice → completion, with no confidence step, no reflection step and no
// retry. It gets its own three screens (`mixed_case` / `mixed_feedback` /
// `mixed_support`) rather than a third value on `TaskStage`, so the
// diagnostic/transfer transitions below keep their exact guards — a mixed
// case can't accidentally satisfy CONTINUE_FROM_DIAGNOSTIC or RETRY_TRANSFER,
// and vice versa.
//
// Both flows converge on the same one-question "retrieval_practice" screen
// (see RetrievalPractice.tsx) once their last task is done, so there's only
// ever one way to reach module_completion: via COMPLETE_MODULE from
// retrieval_practice.

import type { TaskResponseData } from "../types/content";

export type TaskStage = "diagnostic" | "transfer";

export interface SubmissionResult {
  wasCorrect: boolean;
  attempt: number; // 1, or 2 on the one allowed transfer retry
  // The learner's raw structured answer, carried through to the Feedback
  // screen so it can show *what* was mis-sorted/mis-selected — not used for
  // any additional grading, correctness is already decided by `wasCorrect`.
  response: TaskResponseData;
}

export type ScreenState =
  | { screen: "welcome" }
  | { screen: "module_map" }
  | { screen: "concept_journal" }
  // `retryIsDistinctVariant` is only ever set (by RETRY_TRANSFER) when
  // stage === "transfer" && attempt > 1 — it tells the Transfer Task screen
  // whether the retry actually serves a different case (Module 1, which has
  // a stretch variant to swap in) or the identical task again (Module 2,
  // which doesn't have one yet), so the copy shown can stay honest either way.
  | { screen: "task"; moduleId: string; stage: TaskStage; taskId: string; attempt: number; retryIsDistinctVariant?: boolean }
  | { screen: "feedback"; moduleId: string; stage: TaskStage; taskId: string; result: SubmissionResult }
  | { screen: "ai_support"; moduleId: string; stage: TaskStage; taskId: string; result: SubmissionResult }
  // Module 5's flow. No `stage` and no `attempt`: every case is answered
  // exactly once, and which case the learner is on is simply which task is
  // being served (see getNextMixedCaseTask in content/modules.ts).
  | { screen: "mixed_case"; moduleId: string; taskId: string }
  | { screen: "mixed_feedback"; moduleId: string; taskId: string; result: SubmissionResult }
  | { screen: "mixed_support"; moduleId: string; taskId: string; result: SubmissionResult }
  // The one-question Retrieval Practice screen, reached from either flow's
  // last task once it's done — see RetrievalPractice.tsx.
  | { screen: "retrieval_practice"; moduleId: string }
  | { screen: "module_completion"; moduleId: string };

export type ScreenAction =
  | { type: "START" }
  | { type: "SELECT_MODULE"; moduleId: string; diagnosticTaskId: string }
  | { type: "START_MIXED_MODULE"; moduleId: string; taskId: string }
  | { type: "SUBMIT_TASK"; result: SubmissionResult }
  | { type: "REQUEST_SUPPORT" }
  | { type: "CLOSE_SUPPORT" }
  | { type: "CONTINUE_FROM_DIAGNOSTIC"; transferTaskId: string }
  | { type: "RETRY_TRANSFER"; retryTaskId: string; isDistinctVariant: boolean }
  // Leaves a mixed case's feedback screen. `nextTaskId` omitted means that
  // was the last case, so the flow moves on to retrieval practice.
  | { type: "CONTINUE_MIXED"; nextTaskId?: string }
  // Leaves the transfer stage's feedback screen for retrieval practice, once
  // the module is otherwise done (correct, or the one retry used up).
  | { type: "SHOW_RETRIEVAL" }
  | { type: "COMPLETE_MODULE" }
  | { type: "VIEW_JOURNAL" }
  | { type: "BACK_TO_MAP" }
  | { type: "RESET" }
  // Generic escape hatch for "go back to exactly where I was" (used when
  // returning from the Concept Journal, which is reachable from several
  // different screens) — App.tsx supplies the target screen it remembered,
  // rather than the reducer trying to enumerate every entry point.
  | { type: "RESTORE"; screen: ScreenState };

export const initialScreenState: ScreenState = { screen: "welcome" };

function invalidTransition(action: ScreenAction, state: ScreenState): never {
  throw new Error(
    `Invalid screen transition: action "${action.type}" is not valid from screen "${state.screen}". ` +
      `This is a UI wiring bug — a component dispatched an action its current screen doesn't support.`
  );
}

export function screenReducer(state: ScreenState, action: ScreenAction): ScreenState {
  switch (action.type) {
    case "START":
      return { screen: "module_map" };

    case "SELECT_MODULE":
      return {
        screen: "task",
        moduleId: action.moduleId,
        stage: "diagnostic",
        taskId: action.diagnosticTaskId,
        attempt: 1,
      };

    case "START_MIXED_MODULE":
      return { screen: "mixed_case", moduleId: action.moduleId, taskId: action.taskId };

    case "SUBMIT_TASK": {
      if (state.screen === "mixed_case") {
        return { screen: "mixed_feedback", moduleId: state.moduleId, taskId: state.taskId, result: action.result };
      }
      if (state.screen !== "task") return invalidTransition(action, state);
      return {
        screen: "feedback",
        moduleId: state.moduleId,
        stage: state.stage,
        taskId: state.taskId,
        result: action.result,
      };
    }

    case "REQUEST_SUPPORT": {
      if (state.screen === "mixed_feedback") {
        return { screen: "mixed_support", moduleId: state.moduleId, taskId: state.taskId, result: state.result };
      }
      if (state.screen !== "feedback") return invalidTransition(action, state);
      return {
        screen: "ai_support",
        moduleId: state.moduleId,
        stage: state.stage,
        taskId: state.taskId,
        result: state.result,
      };
    }

    case "CLOSE_SUPPORT": {
      if (state.screen === "mixed_support") {
        return { screen: "mixed_feedback", moduleId: state.moduleId, taskId: state.taskId, result: state.result };
      }
      if (state.screen !== "ai_support") return invalidTransition(action, state);
      return {
        screen: "feedback",
        moduleId: state.moduleId,
        stage: state.stage,
        taskId: state.taskId,
        result: state.result,
      };
    }

    case "CONTINUE_FROM_DIAGNOSTIC": {
      const current = state.screen === "feedback" || state.screen === "ai_support" ? state : undefined;
      if (!current || current.stage !== "diagnostic") return invalidTransition(action, state);
      return {
        screen: "task",
        moduleId: current.moduleId,
        stage: "transfer",
        taskId: action.transferTaskId,
        attempt: 1,
      };
    }

    case "RETRY_TRANSFER": {
      const current = state.screen === "feedback" || state.screen === "ai_support" ? state : undefined;
      if (!current || current.stage !== "transfer" || current.result.attempt !== 1) {
        return invalidTransition(action, state);
      }
      return {
        screen: "task",
        moduleId: current.moduleId,
        stage: "transfer",
        taskId: action.retryTaskId,
        attempt: 2,
        retryIsDistinctVariant: action.isDistinctVariant,
      };
    }

    case "CONTINUE_MIXED": {
      const current = state.screen === "mixed_feedback" || state.screen === "mixed_support" ? state : undefined;
      if (!current) return invalidTransition(action, state);
      if (!action.nextTaskId) return { screen: "retrieval_practice", moduleId: current.moduleId };
      return { screen: "mixed_case", moduleId: current.moduleId, taskId: action.nextTaskId };
    }

    case "SHOW_RETRIEVAL": {
      const current = state.screen === "feedback" || state.screen === "ai_support" ? state : undefined;
      if (!current || current.stage !== "transfer") return invalidTransition(action, state);
      return { screen: "retrieval_practice", moduleId: current.moduleId };
    }

    case "COMPLETE_MODULE": {
      if (state.screen !== "retrieval_practice") return invalidTransition(action, state);
      return { screen: "module_completion", moduleId: state.moduleId };
    }

    case "VIEW_JOURNAL":
      return { screen: "concept_journal" };

    case "BACK_TO_MAP":
      return { screen: "module_map" };

    case "RESET":
      return { screen: "welcome" };

    case "RESTORE":
      return action.screen;

    default:
      return state;
  }
}
