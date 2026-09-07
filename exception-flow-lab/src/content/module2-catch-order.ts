// src/content/module2-catch-order.ts
//
// Full task content for Module 2 — "Catch Order & Specificity". Reuses
// Module 1's architecture (Task shape, TaskRenderer, FeedbackCard,
// AiSupportPanel, TransferTaskFlow all work unchanged) but is deliberately
// NOT "Module 1 with a different topic": the diagnostic is a reordering
// task (catch_order), while the transfer task and its retry variant are a
// single-select "read already-written code and judge it" task (single_choice)
// — a genuinely different interaction, per the Case 2 revision.
//
// Unlike Module 1, this isn't a runtime control-flow trace — catch clause
// order/reachability is a static/compile-time rule (an unreachable catch
// block is a compiler error in Java, not just bad style), so these tasks
// have no replayScript. FeedbackCard falls back to a plain code block for
// them, plus a separate ExceptionHierarchy panel (see `hierarchy` below) —
// the class hierarchy is task information the learner reads, never Java
// syntax spliced into the code or a trailing comment.
//
// The transfer task (m2-transfer) has a `retryVariant` (m2-transfer-retry)
// for the one allowed retry after a wrong answer — a different question
// shape (which clause handles a given subtype, rather than does-this-compile)
// over a fresh hierarchy, so a retry never just repeats the same question.

import type { Task, TaskResponseData } from "../types/content";
import { SUPPORT_TITLES } from "../types/content";

// The one rule this whole case teaches, worded precisely enough to survive
// on its own: matching happens through inheritance (a supertype's catch
// also matches its subclasses), order is checked top-to-bottom, and the
// consequence of getting it backwards is a compile error, not just dead
// code. Shared verbatim across every task's `feedback.keyRule` and
// `supportContent.step_by_step.keyRule` in this file, so the one rule stays
// worded identically everywhere the learner sees it.
const KEY_RULE =
  "When `catch` types are related by inheritance, more specific exception types must appear before their supertypes. Otherwise, a later specific handler is unreachable and the program does not compile.";

// --- 1. Diagnostic task ---

function diagnosticIncorrectExplanation(response: TaskResponseData): string {
  if (response.type !== "catch_order") {
    return "A `catch` clause doesn't only match its exact exception type: it also matches every subclass of that type. `FileNotFoundException` is a subclass of `IOException`, which is a subclass of `Exception`, so an earlier, broader clause already matches a thrown `FileNotFoundException`. Because the broader `catch` clause already matches that subtype, the later, more specific clause can never be selected: Java treats it as unreachable and rejects the code at compile time.";
  }
  const order = response.order;
  const indexOf = (id: string) => order.indexOf(id);
  // c1 = catch (Exception e), c2 = catch (FileNotFoundException e), c3 = catch (IOException e)
  const exceptionBeforeFnf = indexOf("c1") < indexOf("c2");
  const exceptionBeforeIoe = indexOf("c1") < indexOf("c3");
  const ioeBeforeFnf = indexOf("c3") < indexOf("c2");

  if (exceptionBeforeFnf || exceptionBeforeIoe) {
    return "`catch (Exception e)` is the broadest of these three: it's a supertype of both `IOException` and `FileNotFoundException`, so it already matches either one. Because the broader `catch (Exception e)` clause already matches both, whichever narrower clause is listed after it can never be selected: Java treats that clause as unreachable and rejects the code at compile time. `Exception` has to come last.";
  }
  if (ioeBeforeFnf) {
    return "`catch (IOException e)` is a supertype of `catch (FileNotFoundException e)`, since `FileNotFoundException` is one of its subclasses, so listing `IOException` first means it already matches a thrown `FileNotFoundException`. Because the broader `IOException` clause already matches it, the later `FileNotFoundException` clause can never be selected: Java treats it as unreachable and rejects the code at compile time. `FileNotFoundException` has to come before `IOException`.";
  }
  return "Not quite the right order. Check each pair of clauses: whichever type is a subclass of another one here has to be listed before it, or that subclass's own clause becomes unreachable.";
}

export const module2DiagnosticTask: Task = {
  id: "m2-diagnostic",
  moduleId: "module-2",
  caseLabel: "Case file: The Unreachable Catch",
  title: "Catch Order & Specificity",
  learningObjective:
    "Understand that a catch clause also matches subclasses of its declared type, and that catch clauses are checked in the order they're written, so a broader clause placed before a related, more specific one makes the specific clause unreachable.",
  misconception:
    "Assuming a `catch` clause only matches its exact exception type, so its position relative to a related supertype or subtype doesn't matter.",
  code: `void loadConfig() {
    try {
        readConfigFile(); // may throw FileNotFoundException
        System.out.println("config loaded");
    }
    // catch clauses go here
}`,
  hierarchy: [
    { label: "Exception", depth: 0 },
    { label: "IOException", depth: 1 },
    { label: "FileNotFoundException", depth: 2 },
  ],
  question: "Put the `catch` clauses in the order they need to appear below the `try` block.",
  answer: {
    type: "catch_order",
    data: {
      clauses: [
        { id: "c1", label: "`catch (Exception e)`" },
        { id: "c2", label: "`catch (FileNotFoundException e)`" },
        { id: "c3", label: "`catch (IOException e)`" },
      ],
      correctOrder: ["c2", "c3", "c1"],
    },
  },
  feedback: {
    correctTitle: "Correct: most specific first.",
    correctExplanation:
      "That's a valid order. Java checks `catch` clauses top-to-bottom and runs the first one whose type matches, and a `catch` for a supertype also matches every one of its subclasses. Placing `FileNotFoundException` first means it's checked before its ancestors `IOException` and `Exception`, so every clause here still gets a chance to run.",
    incorrectTitle: "Not quite: one of these clauses can't be reached.",
    incorrectExplanation:
      "A `catch` clause doesn't only match its exact exception type: it also matches every subclass of that type. `FileNotFoundException` is a subclass of `IOException`, which is a subclass of `Exception`, so placing `IOException` or `Exception` before `FileNotFoundException` means that earlier clause already matches a thrown `FileNotFoundException`. Because the broader `catch` clause already matches that subtype, the later specific clause can never be selected. Java therefore treats it as unreachable and rejects the code at compile time.",
    getIncorrectExplanation: diagnosticIncorrectExplanation,
    keyRule: KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content:
        "A `catch` clause doesn't only match its exact exception type: it also matches every subclass of that type. Which of these three types is a subclass of one of the others in the list?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. `FileNotFoundException` extends `IOException`, and `IOException` extends `Exception`: a `catch` for any one of these also matches every type below it in that chain.\n2. Java checks `catch` clauses in the order they're written and looks for the first one whose type matches.\n3. If `catch (Exception e)` or `catch (IOException e)` came first, it would already match a thrown `FileNotFoundException`, so the `FileNotFoundException` clause after it could never be selected.\n4. Java treats that clause as unreachable and rejects the code at compile time. So the order has to go narrowest to broadest: `FileNotFoundException`, then `IOException`, then `Exception`.",
      keyRule: KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        'A `catch` clause for a general type also accepts anything more specific than it, like a box labeled "vehicles" that also holds every car and bike put into it. If you check the "vehicles" box first, you\'ll never get to open the "bike" box underneath, because the bike was already claimed. The most specific box has to be checked first.',
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    connectToServer(); // may throw SocketException
} catch (SocketException e) {
    System.out.println("connection lost");
} catch (IOException e) {
    System.out.println("connection failed");
} catch (Exception e) {
    System.out.println("something else went wrong");
}
// SocketException extends IOException extends Exception: each clause
// only ever catches what's still left unmatched by the ones above it.`,
    },
  },
  // No replayScript — catch order is a static/compile-time rule, so there's
  // nothing here for ExecutionReplay to animate. FeedbackCard shows
  // resolvedCode instead (see hasReplayScript in types/content.ts).
  resolvedCode: `void loadConfig() {
    try {
        readConfigFile(); // may throw FileNotFoundException
        System.out.println("config loaded");
    } catch (FileNotFoundException e) {
        System.out.println("config file missing");
    } catch (IOException e) {
        System.out.println("could not read config file");
    } catch (Exception e) {
        System.out.println("unexpected error loading config");
    }
}`,
};

// --- 2. Transfer task (baseline) ---
//
// Deliberately not another sorting task — the diagnostic already tests
// "can you construct a valid order"; this tests "can you recognize the same
// reachability rule when you're just reading code someone else wrote,"
// which is a different (and arguably more realistic) skill. The code is
// already fully written; the learner judges it rather than assembling it.

export const module2TransferTask: Task = {
  id: "m2-transfer",
  moduleId: "module-2",
  caseLabel: "Case file: The Ignored Format Error",
  title: "Catch Order & Specificity: Transfer",
  learningObjective: "Recognize the same catch-order rule by reading already-written code, not just by arranging clauses.",
  misconception: "Assuming that listing a broader exception type before a related, more specific subtype is harmless as long as both clauses are present.",
  code: `void parseInput() {
    try {
        parseXml(); // may throw SAXParseException
    } catch (SAXException e) {
        System.out.println("XML error");
    } catch (SAXParseException e) {
        System.out.println("Malformed XML");
    }
}`,
  hierarchy: [
    { label: "SAXException", depth: 0 },
    { label: "SAXParseException", depth: 1 },
  ],
  question: "Will this code compile?",
  answer: {
    type: "single_choice",
    data: {
      options: [
        { id: "m2t-yes", label: "Yes" },
        { id: "m2t-no-parse", label: "No: `catch (SAXParseException e)` is unreachable" },
        { id: "m2t-no-sax", label: "No: `catch (SAXException e)` is unreachable" },
      ],
      correctOptionId: "m2t-no-parse",
    },
  },
  feedback: {
    correctTitle: "Correct: you spotted the unreachable clause.",
    correctExplanation:
      "`catch (SAXException e)` is listed first, and `SAXException` is the supertype of `SAXParseException`, so it already matches any `SAXParseException` thrown here. Because the broader `SAXException` clause already matches it, `catch (SAXParseException e)` can never be selected: Java treats it as unreachable and rejects the code at compile time.",
    incorrectTitle: "Check which clause comes first.",
    incorrectExplanation:
      "`catch (SAXException e)` is listed before `catch (SAXParseException e)`. `SAXException` is the supertype of `SAXParseException`, so that first clause already matches any `SAXParseException`. Because the broader clause already matches it, the second, more specific clause can never be selected: Java treats it as unreachable and rejects the code at compile time.",
    getIncorrectExplanation: (response) => {
      if (response.type !== "single_choice") {
        return "`catch (SAXException e)` is listed before `catch (SAXParseException e)`. `SAXException` is the supertype of `SAXParseException`, so that first clause already matches any `SAXParseException`. The second, more specific clause can never be selected: Java treats it as unreachable and rejects the code at compile time.";
      }
      if (response.selectedOptionId === "m2t-yes") {
        return "This code doesn't actually compile. `catch (SAXException e)` comes first, and `SAXException` is the supertype of `SAXParseException`, so it already matches any `SAXParseException` thrown here. Because the broader clause already matches it, `catch (SAXParseException e)` can never be selected: Java treats it as unreachable and rejects the code at compile time.";
      }
      if (response.selectedOptionId === "m2t-no-sax") {
        return "It's `catch (SAXParseException e)` that's unreachable here, not `catch (SAXException e)`. `SAXException` is the supertype, and it's listed first, so it already matches a thrown `SAXParseException`. The clause that can never be selected is the one below it: `catch (SAXParseException e)`.";
      }
      return "`catch (SAXException e)` is listed before `catch (SAXParseException e)`. `SAXException` is the supertype of `SAXParseException`, so that first clause already matches any `SAXParseException`. The second, more specific clause can never be selected: Java treats it as unreachable and rejects the code at compile time.";
    },
    keyRule: KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "Look at which type is listed first, `SAXException` or `SAXParseException`, and whether one of those types is a supertype of the other.",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. `SAXParseException` extends `SAXException`, so a `catch (SAXException e)` also matches every `SAXParseException`.\n2. Here, `catch (SAXException e)` is listed first, before `catch (SAXParseException e)`.\n3. Because `catch` clauses are matched by type, including through inheritance, `catch (SAXException e)` already covers every `SAXParseException` too.\n4. That makes the second clause, `catch (SAXParseException e)`, unreachable: the broader clause already matches everything it could ever catch, so Java's compiler rejects the code.",
      keyRule: KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "A `catch` clause for a general type also accepts anything more specific than it. Here the general `SAXException` clause is checked first, so it already covers the more specific `SAXParseException`, leaving nothing for the second clause to ever match, which is exactly what Java won't allow.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    Integer.parseInt(input); // may throw NumberFormatException
} catch (IllegalArgumentException e) {
    System.out.println("invalid number");
} catch (NumberFormatException e) {
    System.out.println("not a number");
}
// NumberFormatException extends IllegalArgumentException, so the
// second clause here is unreachable, same problem as before.`,
    },
  },
  isTransferTask: true,
};

// --- 3. Transfer retry variant ---
//
// Served only on the one allowed retry, and only after m2-transfer was
// answered incorrectly (see retryVariant wiring below / getComparableRetryTask
// in content/modules.ts) — a fresh hierarchy, and a differently-shaped
// question: given code that already compiles, which clause actually handles
// a specific thrown subtype? This still tests the exact same mechanism
// (inheritance-based matching + first-match-wins ordering), just from the
// "which one runs" angle instead of "does this compile."

export const module2TransferRetryTask: Task = {
  id: "m2-transfer-retry",
  moduleId: "module-2",
  caseLabel: "Case file: The Silent Handler",
  title: "Catch Order & Specificity: A Trickier Case",
  learningObjective: "Identify which already-correctly-ordered catch clause actually handles a thrown subtype that has no clause of its own.",
  misconception: "Assuming a `catch` clause only matches its exact exception type, so a thrown subclass with no matching clause of its own must be uncaught.",
  code: `void chargeCard() {
    try {
        processPayment(); // throws InsufficientFundsException
    } catch (PaymentException e) {
        System.out.println("payment failed");
    } catch (Exception e) {
        System.out.println("unexpected error");
    }
}`,
  hierarchy: [
    { label: "Exception", depth: 0 },
    { label: "PaymentException", depth: 1 },
    { label: "InsufficientFundsException", depth: 2 },
  ],
  question: "`processPayment()` throws `InsufficientFundsException`. Which `catch` clause actually handles it?",
  answer: {
    type: "single_choice",
    data: {
      options: [
        { id: "m2r-payment", label: "`catch (PaymentException e)`" },
        { id: "m2r-exception", label: "`catch (Exception e)`" },
        { id: "m2r-uncaught", label: "No `catch` clause runs: it propagates uncaught" },
      ],
      correctOptionId: "m2r-payment",
    },
  },
  feedback: {
    correctTitle: "Correct: you found the clause that actually catches it.",
    correctExplanation:
      "`InsufficientFundsException` is a subclass of `PaymentException`, so `catch (PaymentException e)` matches it even though no clause names `InsufficientFundsException` directly. Java checks `catch` clauses in order and runs the first one whose type matches, including matches through inheritance, so `catch (PaymentException e)` runs, and `catch (Exception e)` never gets a turn.",
    incorrectTitle: "Check which clause matches first.",
    incorrectExplanation:
      "`InsufficientFundsException` is a subclass of `PaymentException`, and `catch (PaymentException e)` is listed before `catch (Exception e)`. Java checks `catch` clauses in order and runs the first one whose type matches the thrown exception, including matches through inheritance, so `catch (PaymentException e)` is the one that actually runs here, even though `InsufficientFundsException` has no `catch` clause of its own.",
    getIncorrectExplanation: (response) => {
      if (response.type !== "single_choice") {
        return "`catch (PaymentException e)` is listed before `catch (Exception e)`, and `PaymentException` is a supertype of `InsufficientFundsException`, so `catch (PaymentException e)` is the one that actually runs.";
      }
      if (response.selectedOptionId === "m2r-exception") {
        return "`catch (PaymentException e)` comes first and it already matches `InsufficientFundsException`, since `PaymentException` is one of its supertypes. Java runs the first matching clause it finds, so `catch (Exception e)` never gets reached.";
      }
      if (response.selectedOptionId === "m2r-uncaught") {
        return "This exception is caught, not propagated. `PaymentException` is a supertype of `InsufficientFundsException`, and `catch (PaymentException e)` is listed first: Java matches `catch` clauses by supertype too, not only by exact type, so that clause claims it.";
      }
      return "`catch (PaymentException e)` is listed before `catch (Exception e)`, and `PaymentException` is a supertype of `InsufficientFundsException`, so `catch (PaymentException e)` is the one that actually runs.";
    },
    keyRule: KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "`InsufficientFundsException` doesn't have its own `catch` clause here, but it's a subclass of one of the two types that do. Which one, and which is checked first?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. `InsufficientFundsException` extends `PaymentException`, which extends `Exception`.\n2. Neither `catch` clause names `InsufficientFundsException` directly, but `catch (PaymentException e)` matches it anyway, because `PaymentException` is one of its supertypes.\n3. Java checks `catch` clauses in the order they're written and runs the first one whose type matches, including matches through inheritance.\n4. `catch (PaymentException e)` is listed first and already matches, so that's the clause that runs. `catch (Exception e)` never gets a turn.",
      keyRule: KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "A `catch` clause matches anything that \"is a\" that type, not just an exact match. `PaymentException` is one of `InsufficientFundsException`'s supertypes, so the `PaymentException` clause claims it, and since it's listed first, it gets there before the `Exception` clause ever could.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    openConnection(); // may throw ConnectException
} catch (SocketException e) {
    System.out.println("connection problem");
} catch (Exception e) {
    System.out.println("unexpected error");
}
// ConnectException extends SocketException: there's no catch for
// ConnectException itself, but catch (SocketException e) matches it
// and runs first, so catch (Exception e) never does.`,
    },
  },
  isTransferTask: true,
};

// Wire the retry-only swap (spec §11): a wrong answer on the baseline
// transfer task serves this variant on the one allowed retry, instead of
// literally repeating the same question. See getComparableRetryTask in
// content/modules.ts.
module2TransferTask.retryVariant = module2TransferRetryTask;

export const module2Tasks: Task[] = [module2DiagnosticTask, module2TransferTask, module2TransferRetryTask];
