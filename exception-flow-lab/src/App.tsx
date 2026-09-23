// src/App.tsx
//
// Top-level screen state machine. Owns the two pieces of state everything
// else reads from — the current ScreenState (screenReducer.ts) and
// AppProgress (progressStore.ts) — and renders exactly one screen (A–H)
// at a time based on the former, updating the latter on every task
// submission.

import { useReducer, useRef, useState } from "react";
import {
  modules,
  getModuleById,
  getTaskById,
  getTransferTask,
  getComparableRetryTask,
  isMixedPracticeModule,
  getNextMixedCaseTask,
  getMixedCaseTrail,
  getRetrievalQuestion,
} from "./content/modules";
import { screenReducer, initialScreenState, type ScreenState, type TaskStage } from "./state/screenReducer";
import {
  loadProgress,
  recordTaskAttempt,
  recordRetrievalAnswer,
  resetProgress,
  shouldCollapseSupportPanel,
  getModuleProgress,
  type AppProgress,
  type TaskProgress,
} from "./state/progressStore";
import { evaluateAnswer } from "./state/evaluateAnswer";
import type { SupportType } from "./types/content";
import { Welcome } from "./components/Welcome";
import { ModuleMap } from "./components/ModuleMap";
import { TaskScreen, type TaskSubmission } from "./components/TaskScreen";
import { TransferTaskFlow } from "./components/TransferTaskFlow";
import { FeedbackCard } from "./components/FeedbackCard";
import { AiSupportPanel } from "./components/AiSupportPanel";
import { RetrievalPractice } from "./components/RetrievalPractice";
import { CompletionScreen } from "./components/CompletionScreen";
import { ConceptJournal } from "./components/ConceptJournal";
import { GuidedTour } from "./components/GuidedTour";
import { ModuleReview } from "./components/ModuleReview";
import { ReviewAnswer } from "./components/ReviewAnswer";
import { CaseNav, type CaseProgressStage } from "./components/CaseNav";
import { module1DiagnosticTourSteps } from "./content/guidedTours";
import styles from "./App.module.css";

// Lightweight per-case progress indicator (build spec's Case 1 revision,
// §10), opted into by Module 1 and (per the Case 3 build) Module 3; Module 2
// deliberately kept its plain "← Case files" link with no trail, so it's
// not included here.
function caseProgressStage(moduleId: string, stage: TaskStage): CaseProgressStage | undefined {
  if (moduleId !== "module-1" && moduleId !== "module-3") return undefined;
  return stage === "transfer" ? "transfer" : "feedback";
}

export default function App() {
  const [progress, setProgress] = useState<AppProgress>(() => loadProgress());
  const [screen, dispatch] = useReducer(screenReducer, initialScreenState);
  const previousScreenRef = useRef<ScreenState>(initialScreenState);
  // Live guided tour over Module 1's diagnostic task (build spec §2) — set
  // when entering it fresh (handleSelectModule below), cleared when the
  // tour finishes or is skipped. Not screen-reducer state: it's an overlay
  // on top of the normal "task" screen, not a screen of its own.
  const [module1TourActive, setModule1TourActive] = useState(false);

  function handleStart() {
    dispatch({ type: "START" });
  }

  function handleSelectModule(moduleId: string) {
    const module = getModuleById(moduleId);
    if (!module || !module.available) return;
    // A completed module opens its review menu instead of restarting at
    // task 1 — not_started/in_progress behavior below is unchanged.
    if (getModuleProgress(progress, moduleId)?.state === "completed") {
      dispatch({ type: "VIEW_MODULE_REVIEW", moduleId });
      return;
    }
    if (isMixedPracticeModule(module)) {
      dispatch({ type: "START_MIXED_MODULE", moduleId, taskId: module.taskIds[0] });
      return;
    }
    // Module 1's diagnostic task gets a live guided tour overlaid on the
    // real interface (build spec §2) instead of a separate static
    // instruction screen — see the GuidedTour render below. Reshows on
    // every fresh/resumed start, not just the very first time ever, rather
    // than adding new persisted state to track "already seen".
    if (moduleId === "module-1") {
      setModule1TourActive(true);
    }
    dispatch({ type: "SELECT_MODULE", moduleId, diagnosticTaskId: module.taskIds[0] });
  }

  function handleViewTaskReview(taskId: string) {
    dispatch({ type: "VIEW_TASK_REVIEW", taskId });
  }

  function handleBackToModuleSummary() {
    if (screen.screen !== "task_review") return;
    dispatch({ type: "VIEW_MODULE_REVIEW", moduleId: screen.moduleId });
  }

  function handleTaskSubmit(submission: TaskSubmission) {
    if (screen.screen === "mixed_case") {
      handleMixedCaseSubmit(submission);
      return;
    }
    if (screen.screen !== "task") return;
    const task = getTaskById(screen.taskId);
    if (!task) return;

    const wasCorrect = evaluateAnswer(task.answer, submission.response);
    // On the transfer stage, the module is done once the learner gets it
    // right, OR once they've used their one allowed retry — win or not.
    const moduleCompleted = screen.stage === "transfer" && (wasCorrect || screen.attempt >= 2);

    const taskProgress: TaskProgress = {
      taskId: task.id,
      completed: true,
      selectedAnswer: submission.response,
      wasCorrect,
      supportRequested: [],
      attempt: screen.attempt,
    };

    setProgress(recordTaskAttempt(progress, screen.moduleId, taskProgress, moduleCompleted));
    dispatch({
      type: "SUBMIT_TASK",
      result: {
        wasCorrect,
        attempt: screen.attempt,
        response: submission.response,
      },
    });
  }

  // Module 5's cases are answered exactly once — no retry, so `attempt` is
  // always 1 — and the module counts as completed as soon as the last case
  // has been submitted, correct or not (the point is the practice, and there
  // is nothing left to serve after it).
  function handleMixedCaseSubmit(submission: TaskSubmission) {
    if (screen.screen !== "mixed_case") return;
    const task = getTaskById(screen.taskId);
    const module = getModuleById(screen.moduleId);
    if (!task || !module) return;

    const wasCorrect = evaluateAnswer(task.answer, submission.response);
    const isLastCase = !getNextMixedCaseTask(module, task.id);

    const taskProgress: TaskProgress = {
      taskId: task.id,
      completed: true,
      selectedAnswer: submission.response,
      wasCorrect,
      supportRequested: [],
      attempt: 1,
    };

    setProgress(recordTaskAttempt(progress, screen.moduleId, taskProgress, isLastCase));
    dispatch({ type: "SUBMIT_TASK", result: { wasCorrect, attempt: 1, response: submission.response } });
  }

  function handleContinueMixedCase() {
    if (screen.screen !== "mixed_feedback" && screen.screen !== "mixed_support") return;
    const module = getModuleById(screen.moduleId);
    const task = getTaskById(screen.taskId);
    if (!module || !task) return;
    dispatch({ type: "CONTINUE_MIXED", nextTaskId: getNextMixedCaseTask(module, task.id)?.id });
  }

  function handleRequestSupport() {
    dispatch({ type: "REQUEST_SUPPORT" });
  }

  function handleCloseSupport(requestedInOrder: SupportType[]) {
    if ((screen.screen === "ai_support" || screen.screen === "mixed_support") && requestedInOrder.length > 0) {
      const moduleProgress = progress.modules.find((m) => m.moduleId === screen.moduleId);
      const existing = moduleProgress?.taskProgress.find((t) => t.taskId === screen.taskId);
      if (existing) {
        const staysCompleted = moduleProgress?.state === "completed";
        setProgress(recordTaskAttempt(progress, screen.moduleId, { ...existing, supportRequested: requestedInOrder }, staysCompleted));
      }
    }
    dispatch({ type: "CLOSE_SUPPORT" });
  }

  function handleContinueFromDiagnostic() {
    if ((screen.screen !== "feedback" && screen.screen !== "ai_support") || screen.stage !== "diagnostic") return;
    const module = getModuleById(screen.moduleId);
    if (!module) return;
    const transferTask = getTransferTask(module);
    if (!transferTask) {
      // Defensive fallback — shouldn't happen once a module's transfer task is authored.
      dispatch({ type: "COMPLETE_MODULE" });
      return;
    }
    dispatch({ type: "CONTINUE_FROM_DIAGNOSTIC", transferTaskId: transferTask.id });
  }

  function handleRetryTransfer() {
    if ((screen.screen !== "feedback" && screen.screen !== "ai_support") || screen.stage !== "transfer") return;
    const currentTask = getTaskById(screen.taskId);
    if (!currentTask) return;
    const comparableTask = getComparableRetryTask(currentTask);
    const retryTask = comparableTask ?? currentTask;
    dispatch({ type: "RETRY_TRANSFER", retryTaskId: retryTask.id, isDistinctVariant: Boolean(comparableTask) });
  }

  // Fired from the transfer stage's Feedback screen once the module is
  // otherwise done (correct, or the one retry used up) — moves on to
  // Retrieval Practice rather than straight to the completion screen.
  function handleContinueToRetrieval() {
    dispatch({ type: "SHOW_RETRIEVAL" });
  }

  // Fired from the Retrieval Practice screen's "Complete module" / "Complete
  // learning lab" button. Persists the learner's current explanation text
  // (already reflecting any revisions) for the Concept Journal before
  // advancing — see recordRetrievalAnswer.
  function handleCompleteModule(retrievalAnswer: string) {
    if (screen.screen !== "retrieval_practice") return;
    setProgress(recordRetrievalAnswer(progress, screen.moduleId, retrievalAnswer));
    dispatch({ type: "COMPLETE_MODULE" });
  }

  function handleBackToMap() {
    dispatch({ type: "BACK_TO_MAP" });
  }

  function handleViewJournal() {
    previousScreenRef.current = screen;
    dispatch({ type: "VIEW_JOURNAL" });
  }

  function handleJournalBack() {
    dispatch({ type: "RESTORE", screen: previousScreenRef.current });
  }

  function handleResetProgress() {
    resetProgress();
    setProgress({ modules: [] });
    dispatch({ type: "RESET" });
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <button type="button" className={styles.brand} onClick={handleBackToMap}>
          Exception Flow Lab
        </button>
      </header>

      <main className={styles.main}>{renderScreen()}</main>

      <footer className={styles.footer}>
        <span className={styles.footerNote}>Progress is stored only on this device.</span>
        <button type="button" className={styles.resetButton} onClick={handleResetProgress}>
          Reset progress
        </button>
      </footer>
    </div>
  );

  function renderScreen() {
    switch (screen.screen) {
      case "welcome":
        return <Welcome onStart={handleStart} />;

      case "module_map":
        return (
          <ModuleMap modules={modules} progress={progress} onSelectModule={handleSelectModule} onViewJournal={handleViewJournal} />
        );

      case "concept_journal":
        return <ConceptJournal modules={modules} progress={progress} onBack={handleJournalBack} />;

      case "task": {
        const task = getTaskById(screen.taskId);
        if (!task) return null;
        if (screen.stage === "diagnostic") {
          return (
            <>
              <TaskScreen task={task} stage="diagnostic" onSubmit={handleTaskSubmit} onBackToMap={handleBackToMap} />
              {/* Live guided tour (build spec §2), Module 1's diagnostic task
                  only — highlights the real interface instead of a separate
                  static instruction screen. */}
              {module1TourActive && task.id === "m1-diagnostic" && (
                <GuidedTour steps={module1DiagnosticTourSteps} onFinish={() => setModule1TourActive(false)} />
              )}
            </>
          );
        }
        return (
          <TransferTaskFlow
            task={task}
            attempt={screen.attempt}
            isDistinctRetryVariant={screen.retryIsDistinctVariant}
            onSubmit={handleTaskSubmit}
            onBackToMap={handleBackToMap}
          />
        );
      }

      case "feedback": {
        const task = getTaskById(screen.taskId);
        if (!task) return null;
        const canFinish = screen.stage === "transfer" && (screen.result.wasCorrect || screen.result.attempt >= 2);
        const canRetry = screen.stage === "transfer" && !screen.result.wasCorrect && screen.result.attempt === 1;
        // Only promise "a comparable case" if one is actually authored for
        // this task — otherwise the retry re-serves the identical task, and
        // the button says so instead of overclaiming.
        const retryLabel = canRetry && getComparableRetryTask(task) ? "Try a comparable case" : "Try again";
        return (
          <div className={styles.feedbackWrapper}>
            <CaseNav onBackToMap={handleBackToMap} progressStage={caseProgressStage(screen.moduleId, screen.stage)} />
            <FeedbackCard
              feedback={task.feedback}
              wasCorrect={screen.result.wasCorrect}
              code={task.code}
              replayScript={task.replayScript}
              replayCallout={task.replayCallout}
              replayHeading={task.replayHeading}
              resolvedCode={task.resolvedCode}
              hierarchy={task.hierarchy}
              propagationTrace={task.propagationTrace}
              answer={task.answer}
              response={screen.result.response}
            />
            <div className={styles.feedbackActions}>
              <button type="button" className={styles.secondaryButton} onClick={handleRequestSupport}>
                Explain this another way
              </button>
              {screen.stage === "diagnostic" && (
                <button type="button" className={styles.primaryButton} onClick={handleContinueFromDiagnostic}>
                  Try a new case
                </button>
              )}
              {canRetry && (
                <button type="button" className={styles.primaryButton} onClick={handleRetryTransfer}>
                  {retryLabel}
                </button>
              )}
              {canFinish && (
                <button type="button" className={styles.primaryButton} onClick={handleContinueToRetrieval}>
                  Continue
                </button>
              )}
            </div>
          </div>
        );
      }

      // --- Module 5's mixed-practice flow (see screenReducer.ts) ---
      //
      // Reuses TaskScreen / FeedbackCard / AiSupportPanel unchanged; the only
      // differences are the CaseNav trail (Case 1 → Case 2 → Case 3 instead
      // of Task → Feedback → Transfer) and the feedback actions, which offer
      // exactly one way forward — no retry, no separate "continue to transfer
      // task" branch.
      case "mixed_case": {
        const task = getTaskById(screen.taskId);
        const module = getModuleById(screen.moduleId);
        if (!task || !module) return null;
        return (
          <TaskScreen
            task={task}
            caseTrail={getMixedCaseTrail(module, task.id)}
            onSubmit={handleTaskSubmit}
            onBackToMap={handleBackToMap}
          />
        );
      }

      case "mixed_feedback": {
        const task = getTaskById(screen.taskId);
        const module = getModuleById(screen.moduleId);
        if (!task || !module) return null;
        return (
          <div className={styles.feedbackWrapper}>
            <CaseNav onBackToMap={handleBackToMap} trail={getMixedCaseTrail(module, task.id)} />
            <FeedbackCard
              feedback={task.feedback}
              wasCorrect={screen.result.wasCorrect}
              code={task.code}
              replayScript={task.replayScript}
              replayCallout={task.replayCallout}
              replayHeading={task.replayHeading}
              resolvedCode={task.resolvedCode}
              hierarchy={task.hierarchy}
              propagationTrace={task.propagationTrace}
              answer={task.answer}
              response={screen.result.response}
            />
            <div className={styles.feedbackActions}>
              <button type="button" className={styles.secondaryButton} onClick={handleRequestSupport}>
                Explain this another way
              </button>
              <button type="button" className={styles.primaryButton} onClick={handleContinueMixedCase}>
                {task.mixedCase?.continueLabel ?? "Continue"}
              </button>
            </div>
          </div>
        );
      }

      // AI Support (build spec §9): the task's feedback stays visible in a
      // left column instead of being navigated away from — the panel opens
      // beside it (a right column above ~900px, stacked below it), reusing
      // the exact same FeedbackCard props as the adjacent feedback screen.
      case "mixed_support": {
        const task = getTaskById(screen.taskId);
        const module = getModuleById(screen.moduleId);
        if (!task || !module) return null;
        const moduleProgress = progress.modules.find((m) => m.moduleId === screen.moduleId);
        const existingTaskProgress = moduleProgress?.taskProgress.find((t) => t.taskId === screen.taskId);
        return (
          <div className={styles.supportWrapper}>
            <CaseNav onBackToMap={handleBackToMap} trail={getMixedCaseTrail(module, task.id)} />
            <div className={styles.supportLayout}>
              <div className={styles.supportLayoutMain}>
                <FeedbackCard
                  feedback={task.feedback}
                  wasCorrect={screen.result.wasCorrect}
                  code={task.code}
                  replayScript={task.replayScript}
                  replayCallout={task.replayCallout}
                  replayHeading={task.replayHeading}
                  resolvedCode={task.resolvedCode}
                  hierarchy={task.hierarchy}
                  propagationTrace={task.propagationTrace}
                  answer={task.answer}
                  response={screen.result.response}
                />
              </div>
              <div className={styles.supportLayoutPanel}>
                <AiSupportPanel
                  key={task.id}
                  task={task}
                  collapsedByDefault={shouldCollapseSupportPanel(progress, screen.moduleId)}
                  initialRequested={existingTaskProgress?.supportRequested ?? []}
                  context={{ learnerResponse: screen.result.response, wasCorrect: screen.result.wasCorrect }}
                  onBack={handleCloseSupport}
                />
              </div>
            </div>
          </div>
        );
      }

      case "ai_support": {
        const task = getTaskById(screen.taskId);
        if (!task) return null;
        const moduleProgress = progress.modules.find((m) => m.moduleId === screen.moduleId);
        const existingTaskProgress = moduleProgress?.taskProgress.find((t) => t.taskId === screen.taskId);
        return (
          <div className={styles.supportWrapper}>
            <CaseNav onBackToMap={handleBackToMap} progressStage={caseProgressStage(screen.moduleId, screen.stage)} />
            <div className={styles.supportLayout}>
              <div className={styles.supportLayoutMain}>
                <FeedbackCard
                  feedback={task.feedback}
                  wasCorrect={screen.result.wasCorrect}
                  code={task.code}
                  replayScript={task.replayScript}
                  replayCallout={task.replayCallout}
                  replayHeading={task.replayHeading}
                  resolvedCode={task.resolvedCode}
                  hierarchy={task.hierarchy}
                  propagationTrace={task.propagationTrace}
                  answer={task.answer}
                  response={screen.result.response}
                />
              </div>
              <div className={styles.supportLayoutPanel}>
                <AiSupportPanel
                  key={task.id}
                  task={task}
                  collapsedByDefault={shouldCollapseSupportPanel(progress, screen.moduleId)}
                  initialRequested={existingTaskProgress?.supportRequested ?? []}
                  context={{ learnerResponse: screen.result.response, wasCorrect: screen.result.wasCorrect }}
                  onBack={handleCloseSupport}
                />
              </div>
            </div>
          </div>
        );
      }

      // Retrieval Practice: one open-recall question, shown for every module
      // right after its last task and before its completion screen. Reached
      // from both flows — see SHOW_RETRIEVAL and CONTINUE_MIXED in
      // screenReducer.ts.
      case "retrieval_practice": {
        const module = getModuleById(screen.moduleId);
        const retrievalQuestion = module && getRetrievalQuestion(module.id);
        if (!module || !retrievalQuestion) return null;
        return (
          <div className={styles.feedbackWrapper}>
            <CaseNav onBackToMap={handleBackToMap} />
            <RetrievalPractice
              key={module.id}
              retrievalQuestion={retrievalQuestion}
              completeLabel={isMixedPracticeModule(module) ? "Complete learning lab" : "Complete module"}
              onComplete={handleCompleteModule}
            />
          </div>
        );
      }

      case "module_completion": {
        const module = getModuleById(screen.moduleId);
        if (!module) return null;
        const moduleProgress = progress.modules.find((m) => m.moduleId === screen.moduleId);
        return (
          <CompletionScreen
            module={module}
            moduleProgress={moduleProgress}
            onBackToMap={handleBackToMap}
            onViewJournal={handleViewJournal}
          />
        );
      }

      // --- Post-completion review (build spec §1) ---
      //
      // Only reachable once a module's state is "completed" (see
      // handleSelectModule) — a read-only menu of that learner's own past
      // task screens, never feedback/AI-support/retrieval-practice states.

      case "module_review": {
        const module = getModuleById(screen.moduleId);
        if (!module) return null;
        const moduleProgress = getModuleProgress(progress, screen.moduleId);
        return (
          <ModuleReview
            module={module}
            taskProgress={moduleProgress?.taskProgress ?? []}
            onSelectTask={handleViewTaskReview}
            onBackToMap={handleBackToMap}
          />
        );
      }

      case "task_review": {
        const task = getTaskById(screen.taskId);
        const moduleProgress = getModuleProgress(progress, screen.moduleId);
        const taskProgress = moduleProgress?.taskProgress.find((t) => t.taskId === screen.taskId);
        if (!task || !taskProgress) return null;
        return (
          <TaskScreen
            task={task}
            onBackToMap={handleBackToModuleSummary}
            backLabel="← Back to module summary"
            answerSlot={<ReviewAnswer task={task} taskProgress={taskProgress} />}
          />
        );
      }

      default:
        return null;
    }
  }
}
