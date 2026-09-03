// src/content/module4-designing-handlers.ts
//
// Full task content for Module 4 — "Designing Handlers". Same architecture
// as Modules 1-3 (Task shape, TaskRenderer, FeedbackCard, AiSupportPanel,
// TransferTaskFlow all work unchanged), but its own interaction:
// handler_refactoring — a single-select among complete, hand-written
// `catch` block alternatives (HandlerRefactoringTask), instead of dragging
// cards, picking a step in a call chain, or judging one already-written
// snippet. No drag-and-drop, no confidence question, no reflection question
// anywhere in this module.
//
// The lesson is deliberately two-sided, split across the diagnostic and the
// transfer task instead of just one task teaching "prefer the superclass":
//   - Diagnostic: both subtypes need the SAME reaction, so a shared
//     superclass `catch (PaymentException e)` is the right design —
//     `catch (Exception e)` is broader than necessary, and two identical
//     per-subtype handlers just duplicate what the shared type already
//     expresses.
//   - Transfer: same hierarchy, but the requirement changes so each
//     subtype now needs a DIFFERENT reaction. The superclass handler that
//     was correct a moment ago stops working — it's one `catch` block with
//     one body, so it can't print two different messages — and separate
//     subtype `catch` clauses become the right design instead. This is the
//     point of the whole module: a shared superclass is not automatically
//     "the better" design, it's the right design only when the reaction is
//     shared too.
//
// Not a runtime control-flow trace (no replayScript) and not a static
// ordering rule either (no ExceptionHierarchy-only + catch_order shape like
// Module 2) — the learner picks a complete handler design, and FeedbackCard
// falls back to a plain resolvedCode block, same as Module 2's single_choice
// tasks.

import type { Task, TaskResponseData } from "../types/content";
import { SUPPORT_TITLES } from "../types/content";

// The one rule this whole case teaches, worded so it stands on its own no
// matter which task the learner is looking at. Shared verbatim across every
// task's `feedback.keyRule` in this file.
const KEY_RULE =
  "Choose a handler type that matches the intended group of exceptions. Related exceptions can share a superclass handler when they require the same reaction; use separate handlers when their reactions differ.";

// --- 1. Diagnostic task ---

export const module4DiagnosticTask: Task = {
  id: "m4-diagnostic",
  moduleId: "module-4",
  caseLabel: "Case file: The Blanket Catch",
  title: "Designing Handlers",
  learningObjective:
    "Recognize that when related exception types require the same reaction, a shared superclass `catch` clause expresses that intent directly — more precisely than `catch (Exception e)`, and without the duplication of one `catch` clause per subtype.",
  misconception:
    "Assuming that handling several related exception types requires either `catch (Exception e)` or one `catch` clause per subtype, rather than a single shared superclass `catch` clause when every subtype needs the same reaction.",
  code: `void makePurchase() {
    try {
        processPayment();
    }
    // catch clause(s) go here
}`,
  hierarchy: [
    { label: "PaymentException", depth: 0 },
    { label: "InsufficientFundsException", depth: 1 },
    { label: "AccountLockedException", depth: 1 },
  ],
  orientationNote:
    "`processPayment()` may throw `InsufficientFundsException` or `AccountLockedException`. Each option below is a complete alternative for the missing `catch` clause(s) — choose the design that best matches the requirement.",
  question: "Both payment-related exceptions should produce the same response: `payment failed`. Choose the most appropriate handler design.",
  answer: {
    type: "handler_refactoring",
    data: {
      options: [
        {
          id: "m4d-exception",
          label: "A — overly general: `catch (Exception e)`",
          code: `catch (Exception e) {
    System.out.println("payment failed");
}`,
          isCorrect: false,
        },
        {
          id: "m4d-duplicated",
          label: "B — duplicated handling: two separate `catch` clauses",
          code: `catch (InsufficientFundsException e) {
    System.out.println("payment failed");
}
catch (AccountLockedException e) {
    System.out.println("payment failed");
}`,
          isCorrect: false,
        },
        {
          id: "m4d-superclass",
          label: "C — shared superclass: `catch (PaymentException e)`",
          code: `catch (PaymentException e) {
    System.out.println("payment failed");
}`,
          isCorrect: true,
        },
      ],
    },
  },
  feedback: {
    correctTitle: "Correct — the superclass matches exactly the exceptions that need it.",
    correctExplanation:
      "`PaymentException` is the shared supertype of both `InsufficientFundsException` and `AccountLockedException`, so `catch (PaymentException e)` matches either one. Since both subtypes are supposed to produce the exact same response, one handler for the shared supertype expresses that intent directly — there's no need to name each subtype in its own `catch` clause, and no need to widen the catch beyond payment-related exceptions.",
    incorrectTitle: "Not quite — reconsider what each design actually matches.",
    incorrectExplanation:
      "`PaymentException` is the shared supertype of `InsufficientFundsException` and `AccountLockedException`. Since both need the exact same response, `catch (PaymentException e)` is the design that matches precisely that group — no broader, no narrower, and without repeating the same handler twice.",
    getIncorrectTitle: (response: TaskResponseData) => {
      if (response.type !== "handler_refactoring") return "Not quite — reconsider what each design actually matches.";
      if (response.selectedOptionId === "m4d-exception") return "That's broader than it needs to be.";
      if (response.selectedOptionId === "m4d-duplicated") return "That works, but it repeats itself.";
      return "Not quite — reconsider what each design actually matches.";
    },
    getIncorrectExplanation: (response: TaskResponseData) => {
      if (response.type !== "handler_refactoring") {
        return "`PaymentException` is the shared supertype of `InsufficientFundsException` and `AccountLockedException`. Since both need the exact same response, `catch (PaymentException e)` is the design that matches precisely that group.";
      }
      if (response.selectedOptionId === "m4d-exception") {
        return "`catch (Exception e)` does catch both `InsufficientFundsException` and `AccountLockedException` — but it also catches every other kind of exception `processPayment()` might ever throw, including ones that have nothing to do with payment and shouldn't get the same `\"payment failed\"` response. `PaymentException` is the shared supertype of just the two exceptions this requirement is actually about, so it's the more precise match.";
      }
      if (response.selectedOptionId === "m4d-duplicated") {
        return "That works, but it repeats the same handling. `InsufficientFundsException` and `AccountLockedException` share the superclass `PaymentException` and require the same reaction. A single `catch (PaymentException e)` expresses that intent without duplicating the handler body.";
      }
      return "`PaymentException` is the shared supertype of `InsufficientFundsException` and `AccountLockedException`. Since both need the exact same response, `catch (PaymentException e)` is the design that matches precisely that group.";
    },
    keyRule: KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content:
        "Look at where `InsufficientFundsException` and `AccountLockedException` sit in the hierarchy above. Is there a type that's a supertype of both of them — and only them?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. `InsufficientFundsException` and `AccountLockedException` both extend `PaymentException`, so a `catch (PaymentException e)` clause matches either one.\n2. The requirement says both should produce the exact same response — `\"payment failed\"`.\n3. `catch (Exception e)` would also match both, but it would additionally match every unrelated exception `processPayment()` might throw — broader than the requirement asks for.\n4. Two separate `catch` clauses, one per subtype, would also satisfy the requirement, but both bodies would be identical — duplicated handling that the shared supertype already expresses in one clause.\n5. `catch (PaymentException e)` is the one design that matches exactly the group of exceptions that needs this reaction, without being broader or repeating itself.",
      keyRule: KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "`InsufficientFundsException` and `AccountLockedException` are two specific problems that both belong in the same folder, labeled `PaymentException`. If you use a folder labeled `Exception` instead, you'd also be filing away paperwork that has nothing to do with payments. And if you keep two identical folders instead of the one they already share, you're just doing the same filing twice.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    openConnection(); // may throw ConnectException or SocketTimeoutException
} catch (NetworkException e) {
    System.out.println("connection failed");
}
// ConnectException and SocketTimeoutException both extend NetworkException,
// and both should produce the same response here — so one catch clause for
// the shared supertype is enough. No need for catch (Exception e), and no
// need to repeat "connection failed" in two separate catch clauses.`,
    },
  },
  resolvedCode: `void makePurchase() {
    try {
        processPayment();
    } catch (PaymentException e) {
        System.out.println("payment failed");
    }
}`,
};

// --- 2. Transfer task (baseline) ---
//
// Same hierarchy as the diagnostic, deliberately — the point isn't a new
// set of classes, it's that the requirement itself has changed. Each
// subtype now needs its own reaction, so the superclass handler that was
// correct a moment ago is no longer the right design; separate subtype
// `catch` clauses are. Four options instead of three: the extra one pairs
// one correctly specific clause with a second clause that's still the
// shared superclass — a subtler distractor than "same message repeated",
// since it gets the first exception's reaction right and only the second
// clause is broader than necessary.

export const module4TransferTask: Task = {
  id: "m4-transfer",
  moduleId: "module-4",
  caseLabel: "Case file: One Response Isn't Enough",
  title: "Designing Handlers — Transfer",
  learningObjective:
    "Recognize that a shared superclass handler is only appropriate when the reaction is the same — once related exception types need different reactions, separate subtype `catch` clauses become the appropriate design instead.",
  misconception: "Assuming a shared superclass `catch` clause is always the better design for related exception types, even once they need different reactions.",
  code: `void checkout() {
    try {
        processPayment();
    }
    // catch clause(s) go here
}`,
  hierarchy: [
    { label: "PaymentException", depth: 0 },
    { label: "InsufficientFundsException", depth: 1 },
    { label: "AccountLockedException", depth: 1 },
  ],
  orientationNote:
    "`processPayment()` may throw `InsufficientFundsException` or `AccountLockedException`. The requirement has changed since the last case — read it carefully before choosing.",
  question:
    "Required reactions:\n• `InsufficientFundsException` → `try a smaller amount`\n• `AccountLockedException` → `contact support`\n\nChoose the most appropriate handler design.",
  answer: {
    type: "handler_refactoring",
    data: {
      options: [
        {
          id: "m4t-payment",
          label: "A — one shared handler: `catch (PaymentException e)`",
          code: `catch (PaymentException e) {
    System.out.println("payment failed");
}`,
          isCorrect: false,
        },
        {
          id: "m4t-exception",
          label: "B — overly general: `catch (Exception e)`",
          code: `catch (Exception e) {
    System.out.println("payment failed");
}`,
          isCorrect: false,
        },
        {
          id: "m4t-broad-second",
          label: "C — one specific, one still too broad: `catch (PaymentException e)`",
          code: `catch (InsufficientFundsException e) {
    System.out.println("try a smaller amount");
}
catch (PaymentException e) {
    System.out.println("contact support");
}`,
          isCorrect: false,
        },
        {
          id: "m4t-distinct",
          label: "D — separate handlers, each with its own message",
          code: `catch (InsufficientFundsException e) {
    System.out.println("try a smaller amount");
}
catch (AccountLockedException e) {
    System.out.println("contact support");
}`,
          isCorrect: true,
        },
      ],
    },
  },
  feedback: {
    correctTitle: "Correct — each exception gets its own reaction.",
    correctExplanation:
      "`InsufficientFundsException` and `AccountLockedException` now need to produce different output, so a single shared `catch (PaymentException e)` clause can't express that — it's one `catch` block with one body, and both exceptions match it. Separate `catch` clauses, one for each subtype, allow each exception type to receive the required reaction.",
    incorrectTitle: "Not quite — check whether the design can actually produce two different reactions.",
    incorrectExplanation:
      "`InsufficientFundsException` needs `\"try a smaller amount\"`; `AccountLockedException` needs `\"contact support\"` — two different reactions. Only separate `catch` clauses, one per subtype, with two different bodies, can produce that.",
    getIncorrectTitle: (response: TaskResponseData) => {
      if (response.type !== "handler_refactoring") return "Not quite — check whether the design can actually produce two different reactions.";
      if (response.selectedOptionId === "m4t-payment") return "That handler can only say one thing.";
      if (response.selectedOptionId === "m4t-exception") return "That's broader than it needs to be, and it still only says one thing.";
      if (response.selectedOptionId === "m4t-broad-second") return "The second handler is still broader than it needs to be.";
      return "Not quite — check whether the design can actually produce two different reactions.";
    },
    getIncorrectExplanation: (response: TaskResponseData) => {
      if (response.type !== "handler_refactoring") {
        return "`InsufficientFundsException` needs `\"try a smaller amount\"`; `AccountLockedException` needs `\"contact support\"` — two different reactions. Only separate `catch` clauses, one per subtype, with two different bodies, can produce that.";
      }
      if (response.selectedOptionId === "m4t-payment") {
        return "`catch (PaymentException e)` matches both `InsufficientFundsException` and `AccountLockedException` — but it's a single `catch` block with a single body, so it can only print one message no matter which of the two actually happened. That worked when both needed the same response; now that they don't, one shared handler can't tell them apart.";
      }
      if (response.selectedOptionId === "m4t-exception") {
        return "`catch (Exception e)` has the same problem as the shared superclass — it's still one `catch` block with one body, so it still can't produce two different reactions. It's also broader than necessary, catching unrelated exceptions too.";
      }
      if (response.selectedOptionId === "m4t-broad-second") {
        return "The first clause, `catch (InsufficientFundsException e)`, is fine — it matches exactly that subtype with the right reaction. But the second clause catches `PaymentException`, not `AccountLockedException` specifically — it's broader than necessary, since it would also match any other `PaymentException` subtype, not just the one this reaction is meant for. `catch (AccountLockedException e)` is the design that matches exactly what the requirement asks for.";
      }
      return "`InsufficientFundsException` needs `\"try a smaller amount\"`; `AccountLockedException` needs `\"contact support\"` — two different reactions. Only separate `catch` clauses, one per subtype, with two different bodies, can produce that.";
    },
    keyRule: KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "`InsufficientFundsException` and `AccountLockedException` now need to print different messages. Can one `catch` block, with one body, ever produce two different outputs?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. A single `catch` clause runs one body, no matter which matching subtype was actually thrown.\n2. `InsufficientFundsException` now needs `\"try a smaller amount\"`; `AccountLockedException` needs `\"contact support\"` — two different outputs.\n3. `catch (PaymentException e)` and `catch (Exception e)` are each one block with one body, so neither can tell the two exceptions apart once they need different reactions.\n4. Two separate `catch` clauses — one per subtype — can each have their own body, but only if those bodies actually differ; two clauses that both print the same message still don't satisfy the requirement.\n5. So the design needs two `catch` clauses, one per subtype, each printing its own required message.",
      keyRule: KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "A shared folder works when everything filed in it gets the same reply. But if `InsufficientFundsException` and `AccountLockedException` now each need a different letter sent back, filing them under one shared folder loses that distinction — you need one folder per problem, each with its own reply written inside.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    readSensorData(); // may throw SensorOfflineException or SensorTimeoutException
} catch (SensorOfflineException e) {
    System.out.println("reconnect the sensor");
} catch (SensorTimeoutException e) {
    System.out.println("check the network");
}
// Both extend SensorException, but each needs a different response here —
// so each gets its own catch clause instead of one shared handler.`,
    },
  },
  resolvedCode: `void checkout() {
    try {
        processPayment();
    } catch (InsufficientFundsException e) {
        System.out.println("try a smaller amount");
    } catch (AccountLockedException e) {
        System.out.println("contact support");
    }
}`,
  isTransferTask: true,
};

// --- 3. Transfer retry variant ---
//
// Served only on the one allowed retry, and only after m4-transfer was
// answered incorrectly (see retryVariant wiring below / getComparableRetryTask
// in content/modules.ts) — a fresh hierarchy and domain, same underlying
// rule: related exceptions that now need different reactions call for
// separate subtype handlers, not a shared superclass.

export const module4TransferRetryTask: Task = {
  id: "m4-transfer-retry",
  moduleId: "module-4",
  caseLabel: "Case file: The Order That Needed Two Replies",
  title: "Designing Handlers — A Trickier Case",
  learningObjective: "Apply the same design rule — separate handlers when reactions differ — to a fresh hierarchy and scenario.",
  misconception: "Assuming a shared superclass `catch` clause is always the better design for related exception types, even once they need different reactions.",
  code: `void placeOrder() {
    try {
        submitOrder();
    }
    // catch clause(s) go here
}`,
  hierarchy: [
    { label: "OrderException", depth: 0 },
    { label: "OutOfStockException", depth: 1 },
    { label: "InvalidShippingAddressException", depth: 1 },
  ],
  orientationNote:
    "`submitOrder()` may throw `OutOfStockException` or `InvalidShippingAddressException`. The requirement has changed since the last case — read it carefully before choosing.",
  question:
    "Required reactions:\n• `OutOfStockException` → `item unavailable`\n• `InvalidShippingAddressException` → `update your address`\n\nChoose the most appropriate handler design.",
  answer: {
    type: "handler_refactoring",
    data: {
      options: [
        {
          id: "m4r-order",
          label: "A — one shared handler: `catch (OrderException e)`",
          code: `catch (OrderException e) {
    System.out.println("order failed");
}`,
          isCorrect: false,
        },
        {
          id: "m4r-exception",
          label: "B — overly general: `catch (Exception e)`",
          code: `catch (Exception e) {
    System.out.println("order failed");
}`,
          isCorrect: false,
        },
        {
          id: "m4r-broad-second",
          label: "C — one specific, one still too broad: `catch (OrderException e)`",
          code: `catch (OutOfStockException e) {
    System.out.println("item unavailable");
}
catch (OrderException e) {
    System.out.println("update your address");
}`,
          isCorrect: false,
        },
        {
          id: "m4r-distinct",
          label: "D — separate handlers, each with its own message",
          code: `catch (OutOfStockException e) {
    System.out.println("item unavailable");
}
catch (InvalidShippingAddressException e) {
    System.out.println("update your address");
}`,
          isCorrect: true,
        },
      ],
    },
  },
  feedback: {
    correctTitle: "Correct — each exception gets its own reaction.",
    correctExplanation:
      "`OutOfStockException` and `InvalidShippingAddressException` need to produce different output, so a single shared `catch (OrderException e)` clause can't express that — it's one `catch` block with one body, and both exceptions match it. Separate `catch` clauses, one for each subtype, allow each exception type to receive the required reaction.",
    incorrectTitle: "Not quite — check whether the design can actually produce two different reactions.",
    incorrectExplanation:
      "`OutOfStockException` needs `\"item unavailable\"`; `InvalidShippingAddressException` needs `\"update your address\"` — two different reactions. Only separate `catch` clauses, one per subtype, with two different bodies, can produce that.",
    getIncorrectTitle: (response: TaskResponseData) => {
      if (response.type !== "handler_refactoring") return "Not quite — check whether the design can actually produce two different reactions.";
      if (response.selectedOptionId === "m4r-order") return "That handler can only say one thing.";
      if (response.selectedOptionId === "m4r-exception") return "That's broader than it needs to be, and it still only says one thing.";
      if (response.selectedOptionId === "m4r-broad-second") return "The second handler is still broader than it needs to be.";
      return "Not quite — check whether the design can actually produce two different reactions.";
    },
    getIncorrectExplanation: (response: TaskResponseData) => {
      if (response.type !== "handler_refactoring") {
        return "`OutOfStockException` needs `\"item unavailable\"`; `InvalidShippingAddressException` needs `\"update your address\"` — two different reactions. Only separate `catch` clauses, one per subtype, with two different bodies, can produce that.";
      }
      if (response.selectedOptionId === "m4r-order") {
        return "`catch (OrderException e)` matches both `OutOfStockException` and `InvalidShippingAddressException` — but it's a single `catch` block with a single body, so it can only print one message no matter which of the two actually happened. A shared handler like this works only when both subtypes need the same reaction, and here they don't.";
      }
      if (response.selectedOptionId === "m4r-exception") {
        return "`catch (Exception e)` has the same problem as the shared superclass — it's still one `catch` block with one body, so it still can't produce two different reactions. It's also broader than necessary, catching unrelated exceptions too.";
      }
      if (response.selectedOptionId === "m4r-broad-second") {
        return "The first clause, `catch (OutOfStockException e)`, is fine — it matches exactly that subtype with the right reaction. But the second clause catches `OrderException`, not `InvalidShippingAddressException` specifically — it's broader than necessary, since it would also match any other `OrderException` subtype, not just the one this reaction is meant for. `catch (InvalidShippingAddressException e)` is the design that matches exactly what the requirement asks for.";
      }
      return "`OutOfStockException` needs `\"item unavailable\"`; `InvalidShippingAddressException` needs `\"update your address\"` — two different reactions. Only separate `catch` clauses, one per subtype, with two different bodies, can produce that.";
    },
    keyRule: KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "`OutOfStockException` and `InvalidShippingAddressException` need to print different messages. Can one `catch` block, with one body, ever produce two different outputs?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. A single `catch` clause runs one body, no matter which matching subtype was actually thrown.\n2. `OutOfStockException` needs `\"item unavailable\"`; `InvalidShippingAddressException` needs `\"update your address\"` — two different outputs.\n3. `catch (OrderException e)` and `catch (Exception e)` are each one block with one body, so neither can tell the two exceptions apart.\n4. Two separate `catch` clauses — one per subtype — can each have their own body, but only if those bodies actually differ; two clauses that both print the same message still don't satisfy the requirement.\n5. So the design needs two `catch` clauses, one per subtype, each printing its own required message.",
      keyRule: KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "A shared folder works when everything filed in it gets the same reply. But if `OutOfStockException` and `InvalidShippingAddressException` now each need a different letter sent back, filing them under one shared folder loses that distinction — you need one folder per problem, each with its own reply written inside.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    validateForm(); // may throw MissingFieldException or InvalidFormatException
} catch (MissingFieldException e) {
    System.out.println("fill in the required field");
} catch (InvalidFormatException e) {
    System.out.println("check the format of your input");
}
// Both extend FormValidationException, but each needs a different response
// here — so each gets its own catch clause instead of one shared handler.`,
    },
  },
  resolvedCode: `void placeOrder() {
    try {
        submitOrder();
    } catch (OutOfStockException e) {
        System.out.println("item unavailable");
    } catch (InvalidShippingAddressException e) {
        System.out.println("update your address");
    }
}`,
  isTransferTask: true,
};

// Wire the retry-only swap (spec §11): a wrong answer on the baseline
// transfer task serves this variant on the one allowed retry, instead of
// literally repeating the same question. See getComparableRetryTask in
// content/modules.ts.
module4TransferTask.retryVariant = module4TransferRetryTask;

export const module4Tasks: Task[] = [module4DiagnosticTask, module4TransferTask, module4TransferRetryTask];
