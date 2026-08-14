// src/components/TaskRenderer.tsx
//
// Switches on Task.answer.type to pick the right per-type task component,
// and normalizes each one's raw callback into a TaskResponseData so callers
// (the Task screen) only ever deal with one shape. The discriminated union
// gives full type-checking here — the `never` default is a compile-time
// guarantee that every TaskType is handled.

import type { Task, TaskResponseData } from "../types/content";
import { ExecutionTraceTask } from "./tasks/ExecutionTraceTask";
import { StatementSelectionTask } from "./tasks/StatementSelectionTask";
import { CallChainTask } from "./tasks/CallChainTask";
import { CatchOrderTask } from "./tasks/CatchOrderTask";
import { HandlerSelectionTask } from "./tasks/HandlerSelectionTask";
import { HandlerRefactoringTask } from "./tasks/HandlerRefactoringTask";

export interface TaskRendererProps {
  task: Task;
  onSubmit: (response: TaskResponseData) => void;
  disabled?: boolean;
}

export function TaskRenderer({ task, onSubmit, disabled }: TaskRendererProps) {
  const answer = task.answer;

  switch (answer.type) {
    case "execution_trace":
      return (
        <ExecutionTraceTask
          data={answer.data}
          disabled={disabled}
          onSubmit={(sequence) => onSubmit({ type: "execution_trace", sequence })}
        />
      );
    case "statement_selection":
      return (
        <StatementSelectionTask
          data={answer.data}
          disabled={disabled}
          onSubmit={(selectedIds) => onSubmit({ type: "statement_selection", selectedIds })}
        />
      );
    case "call_chain":
      return (
        <CallChainTask
          data={answer.data}
          disabled={disabled}
          onSubmit={(selectedStepId) => onSubmit({ type: "call_chain", selectedStepId })}
        />
      );
    case "catch_order":
      return (
        <CatchOrderTask data={answer.data} disabled={disabled} onSubmit={(order) => onSubmit({ type: "catch_order", order })} />
      );
    case "handler_selection":
      return (
        <HandlerSelectionTask
          data={answer.data}
          disabled={disabled}
          onSubmit={(selectedOptionId) => onSubmit({ type: "handler_selection", selectedOptionId })}
        />
      );
    case "handler_refactoring":
      return (
        <HandlerRefactoringTask
          data={answer.data}
          disabled={disabled}
          onSubmit={(selectedOptionId) => onSubmit({ type: "handler_refactoring", selectedOptionId })}
        />
      );
    default: {
      const exhaustiveCheck: never = answer;
      throw new Error(`Unhandled task answer type: ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}
