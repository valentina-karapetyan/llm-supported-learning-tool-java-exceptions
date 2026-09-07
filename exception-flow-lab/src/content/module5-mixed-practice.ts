// src/content/module5-mixed-practice.ts
//
// Full task content for Module 5 — "Mixed Case Review". Unlike Modules 1-4,
// this module teaches nothing new. It is interleaved retrieval practice:
// three short cases, each combining rules the learner already met in
// separate modules, with no signposting of which earlier case file a rule
// came from. Recognizing *which* rules apply is the exercise.
//
// Consequences for the content, all deliberate:
//   - No `keyRule` on any task. Feedback.keyRule is optional (see
//     types/content.ts), and FeedbackCard skips the "Key rule" card
//     entirely when it's absent. A rule card here would turn retrieval
//     back into instruction.
//   - Feedback is noticeably shorter than Modules 1-4's — it names what
//     went wrong and shows the resolution, and stops there.
//   - No two consecutive cases share an interaction: Case 1 builds an
//     execution trace, Case 2 picks between complete handler designs,
//     Case 3 first answers a single-choice question about propagation and
//     only then picks a redesign.
//   - No confidence question, no reflection question, no retry — the flow
//     is CASE 1 → CASE 2 → CASE 3 (Part A → Part B) → COMPLETE, driven by
//     Module.flow === "mixed_practice" (see content/modules.ts).
//   - Task titles and case labels never name the rule under test, and never
//     mention which module a rule is from.
//
// Every task still carries a full `supportContent` block, so the app-wide
// "Explain this another way" affordance on the Feedback screen works here
// exactly as it does everywhere else. Those texts are review-flavoured
// (short, no keyRule line) rather than first-teaching explanations.

import type { Task, TaskResponseData } from "../types/content";
import { SUPPORT_TITLES } from "../types/content";

// ---------------------------------------------------------------------------
// CASE 1 — The Missing Confirmation
// ---------------------------------------------------------------------------
//
// Combines two ideas the learner met separately: an exception skips the
// remaining statements in the current execution path, and an exception with
// no local handler propagates to the caller. The trap is that *both* happen
// here, in two different methods: `"order stored"` is skipped inside
// `saveOrder()` (which has no handler at all), and `"order confirmed"` is
// skipped inside `checkout()`'s try block. A learner who only remembers the
// try-block rule tends to keep `"order stored"`, since it isn't in a try
// block at all.

const CASE1_CORE =
  "The exception interrupts the remaining statements in the current execution path and then propagates because no local handler matches.";

function case1IncorrectExplanation(response: TaskResponseData): string {
  if (response.type !== "execution_trace") return CASE1_CORE;
  const seq = response.sequence;
  const keptStored = seq.includes("m5c1-stored");
  const keptConfirmed = seq.includes("m5c1-confirmed");

  if (keptStored && keptConfirmed) {
    return `${CASE1_CORE} Neither \`"order stored"\` nor \`"order confirmed"\` is ever reached.`;
  }
  if (keptStored) {
    return `${CASE1_CORE} \`saveOrder()\` has no \`catch\` clause of its own, so the statement after \`writeOrder()\` is skipped too: \`"order stored"\` never prints.`;
  }
  if (keptConfirmed) {
    return `${CASE1_CORE} By the time the exception reaches \`checkout()\`, the rest of its \`try\` block is already abandoned: \`"order confirmed"\` never prints.`;
  }
  const missing = ["m5c1-call-save", "m5c1-call-write", "m5c1-throw", "m5c1-catch", "m5c1-failed"].filter(
    (id) => !seq.includes(id)
  );
  if (missing.length > 0) {
    return `You correctly left out both printed confirmations. ${CASE1_CORE} The exception still travels \`checkout()\` → \`saveOrder()\` → \`writeOrder()\` and back out to the \`catch\` clause in \`checkout()\`, which prints \`"save failed"\`.`;
  }
  return "You picked the right five events, just not in the order they happen: the calls go inward first, the throw is at the bottom, and only then does control land in `checkout()`'s `catch` clause.";
}

export const module5Case1: Task = {
  id: "m5-case-1",
  moduleId: "module-5",
  caseLabel: "Mixed case 1 of 3",
  title: "The Missing Confirmation",
  learningObjective:
    "Combine skipped statements and propagation: trace an exception through several methods and identify every statement that is therefore never reached.",
  misconception:
    "Assuming only the statements inside the `try` block are skipped, and that a method without a `catch` clause finishes its remaining statements before the exception moves on.",
  code: `void checkout() {
    try {
        saveOrder();
        System.out.println("order confirmed");
    } catch (OrderException e) {
        System.out.println("save failed");
    }
}

void saveOrder() throws OrderException {
    writeOrder();
    System.out.println("order stored");
}

void writeOrder() throws OrderException {
    throw new OrderException();
}`,
  orientationNote: "Follow the execution across the method calls. Determine which events actually occur.",
  question:
    "Build the execution trace. Select the events that occur, in the order they happen. Events you do not select are treated as not occurring in this execution.",
  answer: {
    type: "execution_trace",
    data: {
      cards: [
        { id: "m5c1-call-save", label: "`checkout()` calls `saveOrder()`" },
        { id: "m5c1-call-write", label: "`saveOrder()` calls `writeOrder()`" },
        { id: "m5c1-throw", label: "`writeOrder()` throws `OrderException`" },
        { id: "m5c1-stored", label: '`"order stored"` is printed' },
        { id: "m5c1-confirmed", label: '`"order confirmed"` is printed' },
        { id: "m5c1-catch", label: "The `catch (OrderException e)` clause in `checkout()` runs" },
        { id: "m5c1-failed", label: '`"save failed"` is printed' },
      ],
      // Both printed confirmations are skipped: "order stored" because
      // saveOrder() never resumes after writeOrder() throws, "order
      // confirmed" because checkout()'s try block is abandoned.
      correctOrder: ["m5c1-call-save", "m5c1-call-write", "m5c1-throw", "m5c1-catch", "m5c1-failed"],
    },
  },
  feedback: {
    correctTitle: "Correct: you followed it down and back up.",
    correctExplanation: `${CASE1_CORE} Both \`"order stored"\` and \`"order confirmed"\` sit after the failure in their own methods, so neither is reached.`,
    incorrectTitle: "Not quite: check what the exception leaves behind on its way out.",
    incorrectExplanation: CASE1_CORE,
    getIncorrectExplanation: case1IncorrectExplanation,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "Two `println` statements sit after a call that fails: one of them isn't inside any `try` block. Does that protect it?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        '1. `checkout()` calls `saveOrder()`, which calls `writeOrder()`.\n2. `writeOrder()` throws `OrderException`.\n3. `saveOrder()` has no `catch` clause, so it never resumes: `"order stored"` is skipped and the exception moves on to its caller.\n4. `checkout()` has `catch (OrderException e)`, which matches, so the rest of its `try` block, including `"order confirmed"`, is skipped too.\n5. `"save failed"` prints.',
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "Each method was in the middle of a job when the failure arrived. None of them goes back to finish the part it hadn't done yet: the work resumes only where someone is prepared to deal with the failure.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `void publish() {
    try {
        renderPage();
        System.out.println("published");
    } catch (RenderException e) {
        System.out.println("publish failed");
    }
}

void renderPage() throws RenderException {
    renderBody();
    System.out.println("page rendered");
}
// renderBody() throws: "page rendered" is skipped because renderPage()
// has no handler, and "published" is skipped because publish()'s try
// block is abandoned the moment the exception arrives.`,
    },
  },
  // Line numbers refer to `code` above:
  //   3 saveOrder();            11 writeOrder();
  //   4 "order confirmed"       12 "order stored"
  //   5 } catch (...)           16 throw new OrderException();
  //   6 "save failed"
  replayScript: [
    { lineNumber: 3, state: "active" },
    { lineNumber: 11, state: "active" },
    { lineNumber: 16, state: "throws", badgeLabel: "throws OrderException" },
    { lineNumber: 12, state: "skipped" },
    { lineNumber: 4, state: "skipped" },
    { lineNumber: 5, state: "handled" },
    { lineNumber: 6, state: "handled" },
  ],
  // The default callout ("control jumps straight to the matching catch
  // clause") describes a jump within one method. Here the exception crosses
  // two method boundaries on the way out, and that is half of what this case
  // is testing, so the callout says so explicitly.
  replayCallout:
    "the exception propagates back through `saveOrder()` to the matching `catch` clause in `checkout()`.",
  mixedCase: { trailLabel: "Case 1", continueLabel: "Continue to Case 2" },
};

// ---------------------------------------------------------------------------
// CASE 2 — The Special Case
// ---------------------------------------------------------------------------
//
// Combines catch-clause ordering with handler-scope design, and a three-level
// hierarchy so "is ExpiredCardException a PaymentException?" actually has to
// be read off the hierarchy rather than guessed from the class names sharing
// a prefix. `CardException` is in the hierarchy but in none of the options —
// it's there so the subtype relationship is indirect, not adjacent.
//
// Option labels are purely structural ("X, then Y"), never evaluative — a
// label like Module 4's "overly general" would hand the learner the verdict
// before they've reasoned about it, which defeats the point of a retrieval
// module. They still read well in AnswerDiff's "you picked / correct answer".
//
// `chargeCard()` is declared `throws PaymentException` (stated in the
// orientation note), which is what makes `catch (ExpiredCardException e)`
// legal at all: a catch clause for a checked type is only allowed when the
// try block can throw that type or a super/subtype of it.

const CASE2_CORE =
  "The special subtype needs its own handler, so it must appear before the shared superclass handler. The superclass handler then covers the remaining payment-related exceptions.";

function case2IncorrectTitle(response: TaskResponseData): string {
  if (response.type !== "handler_refactoring") return "Not quite: check the order and the reach of each clause.";
  switch (response.selectedOptionId) {
    case "m5c2-general-first":
      return "That order doesn't compile.";
    case "m5c2-superclass-only":
      return "That can only give one answer.";
    case "m5c2-broad":
      return "The second clause reaches too far.";
    default:
      return "Not quite: check the order and the reach of each clause.";
  }
}

function case2IncorrectExplanation(response: TaskResponseData): string {
  if (response.type !== "handler_refactoring") return CASE2_CORE;
  switch (response.selectedOptionId) {
    case "m5c2-general-first":
      return `\`ExpiredCardException\` is already a \`PaymentException\`, so the first clause matches it and the second one can never be reached: Java rejects that at compile time. ${CASE2_CORE}`;
    case "m5c2-superclass-only":
      return `One clause has one body, so an expired card would also get \`"payment failed"\`. ${CASE2_CORE}`;
    case "m5c2-broad":
      return `\`catch (Exception e)\` is broader than the requirement because it can also catch unrelated exception types. ${CASE2_CORE}`;
    default:
      return CASE2_CORE;
  }
}

export const module5Case2: Task = {
  id: "m5-case-2",
  moduleId: "module-5",
  caseLabel: "Mixed case 2 of 3",
  title: "The Special Case",
  learningObjective:
    "Combine catch-clause ordering with handler scope: give one subtype its own reaction while a shared superclass handler covers the rest.",
  misconception:
    "Treating clause order and clause scope as separate problems: writing the general handler first, or widening it past the group of exceptions the requirement is actually about.",
  code: `void pay() {
    try {
        chargeCard();
    }
    // catch clauses go here
}`,
  hierarchy: [
    { label: "PaymentException", depth: 0 },
    { label: "CardException", depth: 1 },
    { label: "ExpiredCardException", depth: 2 },
  ],
  orientationNote:
    "`chargeCard()` is declared `throws PaymentException`. Each option below is a complete alternative for the missing `catch` clauses.",
  question:
    "Required reactions:\n• `ExpiredCardException` → `card expired`\n• every other `PaymentException` → `payment failed`\n\nWhich handler design best matches the requirement and compiles correctly?",
  answer: {
    type: "handler_refactoring",
    data: {
      options: [
        {
          id: "m5c2-general-first",
          label: "A: `catch (PaymentException e)`, then `catch (ExpiredCardException e)`",
          code: `catch (PaymentException e) {
    System.out.println("payment failed");
}
catch (ExpiredCardException e) {
    System.out.println("card expired");
}`,
          isCorrect: false,
        },
        {
          id: "m5c2-superclass-only",
          label: "B: `catch (PaymentException e)` only",
          code: `catch (PaymentException e) {
    System.out.println("payment failed");
}`,
          isCorrect: false,
        },
        {
          id: "m5c2-specific-first",
          label: "C: `catch (ExpiredCardException e)`, then `catch (PaymentException e)`",
          code: `catch (ExpiredCardException e) {
    System.out.println("card expired");
}
catch (PaymentException e) {
    System.out.println("payment failed");
}`,
          isCorrect: true,
        },
        {
          id: "m5c2-broad",
          label: "D: `catch (ExpiredCardException e)`, then `catch (Exception e)`",
          code: `catch (ExpiredCardException e) {
    System.out.println("card expired");
}
catch (Exception e) {
    System.out.println("payment failed");
}`,
          isCorrect: false,
        },
      ],
    },
  },
  feedback: {
    correctTitle: "Correct: specific first, shared handler behind it.",
    correctExplanation: CASE2_CORE,
    incorrectTitle: "Not quite: check the order and the reach of each clause.",
    incorrectExplanation: CASE2_CORE,
    getIncorrectTitle: case2IncorrectTitle,
    getIncorrectExplanation: case2IncorrectExplanation,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content:
        "Read the hierarchy first: an `ExpiredCardException` is also a `CardException`, and a `CardException` is also a `PaymentException`. Which clause would claim it if `catch (PaymentException e)` came first?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        '1. `ExpiredCardException` is an indirect subtype of `PaymentException`, so any `catch (PaymentException e)` clause matches it.\n2. That means a `PaymentException` clause placed first would leave a later `ExpiredCardException` clause unreachable: a compile error.\n3. One `catch (PaymentException e)` on its own has a single body, so it cannot say `"card expired"` for one subtype and `"payment failed"` for the rest.\n4. `catch (Exception e)` would answer `"payment failed"` far beyond the payment-related failures the requirement names.\n5. So: `catch (ExpiredCardException e)` first, `catch (PaymentException e)` behind it.',
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "One case needs a special answer, everything else in the same family needs the standard answer. Deal with the special case first: once the family-wide handler has the exception, it is too late to single anything out.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    openConnection(); // declared: throws IOException
} catch (SocketTimeoutException e) {
    System.out.println("connection timed out");
} catch (IOException e) {
    System.out.println("connection failed");
}
// SocketTimeoutException extends IOException, so the specific clause has
// to come first; the IOException clause then covers everything else.`,
    },
  },
  resolvedCode: `void pay() {
    try {
        chargeCard();
    } catch (ExpiredCardException e) {
        System.out.println("card expired");
    } catch (PaymentException e) {
        System.out.println("payment failed");
    }
}`,
  mixedCase: { trailLabel: "Case 2", continueLabel: "Continue to Case 3" },
};

// ---------------------------------------------------------------------------
// CASE 3 — The Handler That Never Sees It  (Part A + Part B)
// ---------------------------------------------------------------------------
//
// The hardest case, split into two questions over one snippet so it can ask
// "what happens" and then "so how should it be built" without becoming one
// oversized exercise. Part A is a single-choice judgment about which handler
// actually receives the exception; Part B, once the requirement changes, is
// a redesign choice. Two different interactions, one case file.
//
// `process()` must declare `throws FileNotFoundException` in the Part A/B
// snippet: its own try block already catches everything `readFile()` can
// throw, so nothing escapes at runtime — but `start()`'s
// `catch (FileNotFoundException e)` only compiles if `process()` is declared
// able to produce one. That declaration is exactly what makes the case
// interesting: on paper a FileNotFoundException could reach `start()`, and
// `process()`'s broader handler still claims it first.

const CASE3A_CORE =
  "Java does not search the whole call chain for the most specific handler. Propagation stops at the first compatible handler encountered.";

const CASE3_CODE = `void start() {
    try {
        process();
    } catch (FileNotFoundException e) {
        System.out.println("specific outer handler");
    }
}

void process() throws FileNotFoundException {
    try {
        readFile();
    } catch (IOException e) {
        System.out.println("general inner handler");
    }
}

void readFile() throws FileNotFoundException {
    throw new FileNotFoundException();
}`;

function case3aIncorrectTitle(response: TaskResponseData): string {
  if (response.type !== "single_choice") return "Not quite: check which handler is reached first.";
  switch (response.selectedOptionId) {
    case "m5c3a-outer":
      return "A closer handler claimed it first.";
    case "m5c3a-both":
      return "Only one handler ever runs.";
    case "m5c3a-neither":
      return "One of them does match.";
    default:
      return "Not quite: check which handler is reached first.";
  }
}

function case3aIncorrectExplanation(response: TaskResponseData): string {
  if (response.type !== "single_choice") return CASE3A_CORE;
  switch (response.selectedOptionId) {
    case "m5c3a-outer":
      return `\`start()\` names the exact type, but \`process()\` is reached first and \`FileNotFoundException\` is an \`IOException\`, so its clause already matches. ${CASE3A_CORE}`;
    case "m5c3a-both":
      return `A single thrown exception is handled once. ${CASE3A_CORE}`;
    case "m5c3a-neither":
      return `\`FileNotFoundException\` is an \`IOException\`, so \`process()\`'s clause is compatible with it. ${CASE3A_CORE}`;
    default:
      return CASE3A_CORE;
  }
}

export const module5Case3PartA: Task = {
  id: "m5-case-3a",
  moduleId: "module-5",
  caseLabel: "Mixed case 3 of 3 · Part A",
  title: "The Handler That Never Sees It",
  learningObjective:
    "Combine propagation, hierarchy compatibility and first-match handling: identify which of two plausible handlers actually receives the exception.",
  misconception:
    "Assuming Java keeps searching outward for the handler whose type matches most exactly, instead of stopping at the first compatible handler it reaches.",
  code: CASE3_CODE,
  hierarchy: [
    { label: "IOException", depth: 0 },
    { label: "FileNotFoundException", depth: 1 },
  ],
  callChainTrail: [{ methodName: "start()" }, { methodName: "process()" }, { methodName: "readFile()", isOrigin: true }],
  orientationNote: "Two handlers could plausibly apply here. Work out which one the exception actually reaches.",
  question: "Which handler actually receives the `FileNotFoundException`?",
  answer: {
    type: "single_choice",
    data: {
      submitLabel: "Check my answer",
      options: [
        { id: "m5c3a-inner", label: "`catch (IOException e)` inside `process()`" },
        { id: "m5c3a-outer", label: "`catch (FileNotFoundException e)` inside `start()`" },
        { id: "m5c3a-both", label: "Both handlers run" },
        { id: "m5c3a-neither", label: "Neither handler runs" },
      ],
      correctOptionId: "m5c3a-inner",
    },
  },
  feedback: {
    correctTitle: "Correct: the first compatible handler encountered takes it.",
    correctExplanation: CASE3A_CORE,
    incorrectTitle: "Not quite: check which handler is reached first.",
    incorrectExplanation: CASE3A_CORE,
    getIncorrectTitle: case3aIncorrectTitle,
    getIncorrectExplanation: case3aIncorrectExplanation,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "Start where the exception is thrown and move outward one method at a time. Which handler do you meet first, and is it compatible?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        '1. `readFile()` throws `FileNotFoundException` and has no handler of its own.\n2. Its caller is `process()`, whose `catch (IOException e)` is checked next.\n3. `FileNotFoundException` is a subtype of `IOException`, so that clause is compatible: it runs and prints `"general inner handler"`.\n4. The exception is handled, so it never travels on to `start()`.',
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "The first person able to deal with the problem deals with it. Nobody passes it further along on the grounds that someone down the corridor is a closer match.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `void run() {
    try {
        step1();
    } catch (ArithmeticException e) {
        System.out.println("outer");
    }
}

void step1() {
    try {
        throw new ArithmeticException();
    } catch (RuntimeException e) {
        System.out.println("inner");
    }
}
// "inner" prints. ArithmeticException is a RuntimeException, so step1()'s
// broader clause is compatible and the exception stops there.`,
    },
  },
  propagationTrace: [
    { methodName: "readFile()", detail: "throws `FileNotFoundException`", status: "throws" },
    { methodName: "process()", detail: "`catch (IOException e)` is compatible: handled here", status: "handled" },
  ],
  mixedCase: { trailLabel: "Case 3", continueLabel: "Continue to Part B" },
};

// --- Case 3, Part B ---
//
// Changed requirement, and one changed line of code. The design has to be
// placed where the exception is actually reached (Part A's lesson), ordered
// specific-before-general, and scoped to the exception family the
// requirement names.
//
// CASE3B_CODE differs from CASE3_CODE in exactly one place: `readFile()` is
// declared `throws IOException` with its body omitted, instead of concretely
// throwing a `FileNotFoundException`. Each part needs its own version:
//   - Part A needs the concrete throw, so there is one unambiguous exception
//     to trace to one unambiguous handler.
//   - Part B needs the broader declaration, or its second requirement
//     ("every other `IOException` → `I/O problem`") would describe a case
//     that can never arise, and the correct design's `catch (IOException e)`
//     clause would be dead code the learner is asked to write anyway.
// The orientation note states the change, so the learner isn't left to spot
// a one-line difference between two otherwise identical snippets.
//
// Every option is a complete, self-contained alternative, so the orientation
// note also has to pin down what happens to `start()` — otherwise "does the
// outer catch still exist?" would decide compilability rather than the
// learner's reasoning.

const CASE3B_CODE = `void start() {
    try {
        process();
    } catch (FileNotFoundException e) {
        System.out.println("specific outer handler");
    }
}

void process() throws FileNotFoundException {
    try {
        readFile();
    } catch (IOException e) {
        System.out.println("general inner handler");
    }
}

void readFile() throws IOException {
    // implementation omitted
}`;

const CASE3B_CORE =
  "Put both handlers where the exception is actually reached, specific one first: the `IOException` clause then covers the rest.";

function case3bIncorrectTitle(response: TaskResponseData): string {
  if (response.type !== "handler_refactoring") return "Not quite: check where the handlers sit and in which order.";
  switch (response.selectedOptionId) {
    case "m5c3b-split":
      return "The outer handler still never runs.";
    case "m5c3b-general-first":
      return "That order doesn't compile.";
    case "m5c3b-broad":
      return "One clause can't give two answers.";
    default:
      return "Not quite: check where the handlers sit and in which order.";
  }
}

function case3bIncorrectExplanation(response: TaskResponseData): string {
  if (response.type !== "handler_refactoring") return CASE3B_CORE;
  switch (response.selectedOptionId) {
    case "m5c3b-split":
      return `This is the design you just traced: \`process()\`'s \`catch (IOException e)\` still claims the \`FileNotFoundException\` first, so \`"file missing"\` never prints. ${CASE3B_CORE}`;
    case "m5c3b-general-first":
      return `\`catch (IOException e)\` in front makes the \`FileNotFoundException\` clause unreachable, which Java rejects at compile time. ${CASE3B_CORE}`;
    case "m5c3b-broad":
      return `A single \`catch (Exception e)\` has one body, so it cannot answer \`"file missing"\` for one type and \`"I/O problem"\` for the others, and it reaches well past I/O failures. ${CASE3B_CORE}`;
    default:
      return CASE3B_CORE;
  }
}

export const module5Case3PartB: Task = {
  id: "m5-case-3b",
  moduleId: "module-5",
  caseLabel: "Mixed case 3 of 3 · Part B",
  title: "The Handler That Never Sees It",
  learningObjective:
    "Design handlers for two different reactions at the location the exception actually reaches, with the specific clause ahead of the general one.",
  misconception:
    "Placing a specific handler further out in the call chain and expecting it to run, or ordering the general handler ahead of the specific one.",
  code: CASE3B_CODE,
  hierarchy: [
    { label: "IOException", depth: 0 },
    { label: "FileNotFoundException", depth: 1 },
  ],
  orientationNote:
    "`readFile()` may throw `FileNotFoundException` or another subtype of `IOException`. The requirement has changed, and the code above is the design being replaced: in each option `start()` simply calls `process()` with no `try`/`catch` of its own, unless that option shows one.",
  question:
    "Required reactions:\n• `FileNotFoundException` → `file missing`\n• every other `IOException` → `I/O problem`\n\nWhich redesign correctly expresses this requirement?",
  answer: {
    type: "handler_refactoring",
    data: {
      options: [
        {
          id: "m5c3b-split",
          label: "A: `catch (IOException e)` in `process()`, `catch (FileNotFoundException e)` in `start()`",
          code: `void start() {
    try {
        process();
    } catch (FileNotFoundException e) {
        System.out.println("file missing");
    }
}

void process() throws FileNotFoundException {
    try {
        readFile();
    } catch (IOException e) {
        System.out.println("I/O problem");
    }
}`,
          isCorrect: false,
        },
        {
          id: "m5c3b-general-first",
          label: "B: both handlers in `process()`, `IOException` first",
          code: `void process() {
    try {
        readFile();
    } catch (IOException e) {
        System.out.println("I/O problem");
    } catch (FileNotFoundException e) {
        System.out.println("file missing");
    }
}`,
          isCorrect: false,
        },
        {
          id: "m5c3b-specific-first",
          label: "C: both handlers in `process()`, `FileNotFoundException` first",
          code: `void process() {
    try {
        readFile();
    } catch (FileNotFoundException e) {
        System.out.println("file missing");
    } catch (IOException e) {
        System.out.println("I/O problem");
    }
}`,
          isCorrect: true,
        },
        {
          id: "m5c3b-broad",
          label: "D: one `catch (Exception e)` in `process()`",
          code: `void process() {
    try {
        readFile();
    } catch (Exception e) {
        System.out.println("I/O problem");
    }
}`,
          isCorrect: false,
        },
      ],
    },
  },
  feedback: {
    correctTitle: "Correct: right place, right order.",
    correctExplanation:
      "Both required handlers are placed in `process()`. `FileNotFoundException` is handled first, while the following `IOException` handler covers the remaining I/O failures.",
    incorrectTitle: "Not quite: check where the handlers sit and in which order.",
    incorrectExplanation: CASE3B_CORE,
    getIncorrectTitle: case3bIncorrectTitle,
    getIncorrectExplanation: case3bIncorrectExplanation,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "Part A already showed which method the exception reaches. Two different reactions have to be expressible there, and in an order Java accepts.",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. The exception is caught in `process()`, so that is where both reactions have to live.\n2. Two different messages need two clauses: one `catch` block has one body.\n3. `FileNotFoundException` is a subtype of `IOException`, so it has to be listed first or its clause is unreachable.\n4. `catch (Exception e)` fails on both counts: one body, and broader than the I/O failures the requirement names.\n5. So: `catch (FileNotFoundException e)` first, `catch (IOException e)` behind it for the rest.",
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "Handle it where it actually arrives, and put the narrow case in front of the broad one. A handler further away never gets a turn, and a broad handler placed first leaves the narrow one with nothing to do.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `void load() {
    try {
        parse();
    } catch (NumberFormatException e) {
        System.out.println("not a number");
    } catch (IllegalArgumentException e) {
        System.out.println("bad argument");
    }
}
// NumberFormatException extends IllegalArgumentException. Both clauses sit
// in the method that actually catches, narrowest first.`,
    },
  },
  resolvedCode: `void start() {
    process();
}

void process() {
    try {
        readFile();
    } catch (FileNotFoundException e) {
        System.out.println("file missing");
    } catch (IOException e) {
        System.out.println("I/O problem");
    }
}

void readFile() throws IOException {
    // implementation omitted
}`,
  mixedCase: { trailLabel: "Case 3", continueLabel: "See the summary" },
};

export const module5Tasks: Task[] = [module5Case1, module5Case2, module5Case3PartA, module5Case3PartB];
