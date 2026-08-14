// src/state/screenReducer.ts
//
// Top-level screen state machine for App.tsx. Encodes the flow the build
// spec calls out as the thing that must work end-to-end before anything
// else: diagnostic task → feedback → (optional) AI support → transfer task
// → (optional retry, once) → module completion. Concept Journal is reachable
// as a side screen, not part of that linear flow.

import type { ConfidenceLevel, TaskResponseData } from "../types/content";

export type TaskStage = "diagnostic" | "transfer";

export interface SubmissionResult {
  wasCorrect: boolean;
  confidence: ConfidenceLevel;
  articulationText: string;
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
  | { screen: "task"; moduleId: string; stage: TaskStage; taskId: string; attempt: number }
  | { screen: "feedback"; moduleId: string; stage: TaskStage; taskId: string; result: SubmissionResult }
  | { screen: "ai_support"; moduleId: string; stage: TaskStage; taskId: string; result: SubmissionResult }
  | { screen: "module_completion"; moduleId: string };

export type ScreenAction =
  | { type: "START" }
  | { type: "SELECT_MODULE"; moduleId: string; diagnosticTaskId: string }
  | { type: "SUBMIT_TASK"; result: SubmissionResult }
  | { type: "REQUEST_SUPPORT" }
  | { type: "CLOSE_SUPPORT" }
  | { type: "CONTINUE_FROM_DIAGNOSTIC"; transferTaskId: string }
  | { type: "RETRY_TRANSFER"; retryTaskId: string }
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

    case "SUBMIT_TASK": {
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
      };
    }

    case "COMPLETE_MODULE": {
      const current = state.screen === "feedback" || state.screen === "ai_support" ? state : undefined;
      if (!current || current.stage !== "transfer") return invalidTransition(action, state);
      return { screen: "module_completion", moduleId: current.moduleId };
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
