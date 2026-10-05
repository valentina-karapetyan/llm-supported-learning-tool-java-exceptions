// src/content/retrievalQuestions.ts
//
// One Retrieval Practice question per module (Modules 1-5). Shown on its own
// screen after a module's final task and before its completion screen (see
// RetrievalPractice.tsx and the "retrieval_practice" screen in App.tsx).
//
// This file is the ONLY place a question's referenceAnswer/requiredConcepts/
// commonMisconceptions are authored. A future LLM comparison step receives
// the learner's answer plus exactly these predefined fields — it only
// compares and explains, it never invents correctness criteria or decides
// what the learner was supposed to learn. See RetrievalQuestion and
// RetrievalComparisonResult in types/content.ts.
//
// Every question is open recall, not multiple-choice, and introduces no new
// theory of its own — each restates a rule already taught by the module it
// belongs to.

import type { RetrievalQuestion } from "../types/content";

export const module1Retrieval: RetrievalQuestion = {
  id: "m1-retrieval",
  moduleId: "module-1",
  question:
    "What happens to the remaining statements in a `try` block after a statement throws an exception that is caught by a matching `catch` clause?",
  referenceAnswer:
    "The remaining statements in the `try` block are skipped, and control transfers to the matching `catch` clause.",
  requiredConcepts: [
    "the remaining statements in the `try` block are skipped, not executed",
    "control transfers to the matching `catch` clause",
  ],
  commonMisconceptions: [
    "execution continues with the next statement in the `try` block",
    "the `catch` clause runs only after the whole `try` block finishes",
    "both the remaining normal statements and the `catch` clause execute in sequence",
  ],
};

export const module2Retrieval: RetrievalQuestion = {
  id: "m2-retrieval",
  moduleId: "module-2",
  question: "Why must a `catch` clause for a subclass appear before a `catch` clause for its superclass?",
  referenceAnswer:
    "A superclass handler also matches exceptions of its subclasses. If the superclass handler appears first, it catches the subclass exception before the more specific handler can be reached, making the later specific handler unreachable and causing a compilation error.",
  requiredConcepts: [
    "a superclass handler also matches exceptions of its subclasses",
    "`catch` clauses are checked in order, so an earlier general handler prevents a later, more specific one from ever being reached",
    "an unreachable `catch` clause is a compile-time error in Java",
  ],
  commonMisconceptions: [
    "Java automatically chooses the most specific handler regardless of order",
    "catch order is only a style recommendation",
    "a superclass handler only catches exactly its own type",
  ],
};

export const module3Retrieval: RetrievalQuestion = {
  id: "m3-retrieval",
  moduleId: "module-3",
  question: "What happens when a method throws an exception but does not contain a compatible handler for it?",
  referenceAnswer:
    "The exception propagates to the caller. It continues through the active call chain until the first compatible handler is found. If no compatible handler exists, the exception remains uncaught.",
  requiredConcepts: [
    "the exception propagates to the caller",
    "propagation continues through the active calling chain until the first compatible handler is found",
    "if no compatible handler exists anywhere in the chain, the exception remains uncaught",
  ],
  commonMisconceptions: [
    "the immediate caller automatically handles the exception",
    "Java searches the whole program for the most specific handler",
    "an exception can only be handled in the method where it was thrown",
  ],
};

export const module4Retrieval: RetrievalQuestion = {
  id: "m4-retrieval",
  moduleId: "module-4",
  question: "When should related exceptions share one superclass `catch` clause, and when should they be handled separately?",
  referenceAnswer:
    "Related exceptions can share a superclass handler when they require the same reaction. They should use separate subtype handlers when they require different reactions. (It also helps to avoid duplicating identical handlers when one shared superclass handler already expresses the same intent, and to avoid unnecessarily broad handling such as an unrelated `catch (Exception e)` — useful supporting habits, but not the core of what this question is asking.)",
  requiredConcepts: [
    "related exceptions can share a superclass handler when they require the same reaction",
    "exceptions should be handled separately, with their own subtype handlers, when they require different reactions",
  ],
  commonMisconceptions: [
    "related exceptions should always use one superclass handler",
    "every subtype should always have a separate handler",
    "`catch (Exception e)` is always the safest or best solution",
  ],
};

export const module5Retrieval: RetrievalQuestion = {
  id: "m5-retrieval",
  moduleId: "module-5",
  question:
    "Trace what happens when an exception is thrown deep inside a chain of method calls: from the moment it's thrown, through how far it travels, to the `catch` clause that finally handles it.",
  referenceAnswer:
    "Throwing the exception interrupts the current execution path, so its remaining statements are skipped. If there's no compatible local handler, it propagates through the active callers. Exception hierarchy determines which handlers are compatible, and propagation stops at the first one encountered. Handler design should then reflect whether the exceptions involved need the same reaction or separate ones.",
  requiredConcepts: [
    "throwing interrupts the current execution path, so its remaining statements are skipped",
    "if there is no compatible handler locally, the exception propagates through the active callers",
    "propagation stops at the first compatible handler, where compatibility is determined by exception type/hierarchy",
    "handler design should reflect whether the exceptions involved need a shared or separate reaction",
  ],
  commonMisconceptions: [
    "execution resumes with skipped statements after the handler",
    "Java always chooses the most specific handler anywhere in the call chain",
    "propagation automatically stops at the immediate caller",
    "a general handler is always preferable",
  ],
};

const retrievalQuestionsByModuleId: Record<string, RetrievalQuestion> = {
  "module-1": module1Retrieval,
  "module-2": module2Retrieval,
  "module-3": module3Retrieval,
  "module-4": module4Retrieval,
  "module-5": module5Retrieval,
};

export function getRetrievalQuestion(moduleId: string): RetrievalQuestion | undefined {
  return retrievalQuestionsByModuleId[moduleId];
}
