// src/content/module3-call-chains.ts
//
// Full task content for Module 3 — "Call Chains & Propagation". Same
// architecture as Modules 1 and 2 (Task shape, TaskRenderer, FeedbackCard,
// AiSupportPanel, TransferTaskFlow, and Module 2's single_choice type all
// work unchanged) but its own interaction: Module 1 answers by dragging
// events into order, Module 2's diagnostic answers by dragging catch
// clauses into order — Module 3 answers by reading a call chain and
// picking where the exception ends up, a single-select judgment task (same
// shape as Module 2's transfer task) applied to a different rule entirely:
// propagation up the call stack, not catch-clause reachability within one
// try block.
//
// Two presentational-only additions, both opt-in via optional Task fields
// (see types/content.ts) so Modules 1 and 2 are unaffected:
//   - callChainTrail: the "start() → loadProfile() → readProfileFile()"
//     visual shown above the question (CallChainTrail component). Marks
//     only where the exception originates, never where it's handled.
//   - propagationTrace: the animated "exception moves up the call chain"
//     visualization on the Feedback screen (PropagationReplay component) —
//     Module 3's answer to Module 1's ExecutionReplay, since propagation
//     crosses method boundaries in a way per-line code highlighting can't
//     show clearly. FeedbackCard prefers this over the plain-code fallback
//     whenever a task supplies it (see that component's branch order).
//
// No replayScript on any task here — propagation isn't a single-code-block
// control-flow trace, so ExecutionReplay wouldn't apply.
//
// The transfer task's whole point (per the Case 3 build spec) is that
// propagation stops at the *first* compatible handler on the way back
// through the call chain — Java does not keep searching outward for the
// most specific one anywhere in the program. That's deliberately a
// different lesson from Module 2's "specific before general," which is
// about ordering *adjacent* catch clauses in one try block, not searching
// across call frames — the transfer task's feedback says so explicitly, so
// the two rules don't blur together in a learner's head.

import type { Task, TaskResponseData } from "../types/content";
import { SUPPORT_TITLES } from "../types/content";

const PROPAGATION_KEY_RULE =
  "If a method has no matching handler, the exception propagates to its caller. Java continues up the calling chain until it finds a compatible `catch` clause. If none is found, the exception remains uncaught.";

const FIRST_MATCH_KEY_RULE = "Propagation stops at the first compatible handler encountered on the way back through the call chain.";

// --- 1. Diagnostic task ---

// The full trace, reused as the correct-answer explanation and appended to
// every wrong-answer branch below, so the complete picture is always on
// screen regardless of which option the learner picked.
const DIAGNOSTIC_CORE =
  "`readProfileFile()` throws `FileNotFoundException`. There is no matching handler there, so the exception propagates back to `loadProfile()`. `loadProfile()` also has no handler, so it continues to `start()`. The `catch (IOException e)` clause matches because `FileNotFoundException` is a subtype of `IOException`, so the exception is handled there.";

function diagnosticIncorrectTitle(response: TaskResponseData): string {
  if (response.type !== "single_choice") return "Not quite — trace the propagation again.";
  switch (response.selectedOptionId) {
    case "m3d-here":
      return "Not quite — throwing and handling are separate steps.";
    case "m3d-caller":
      return "Not quite — the immediate caller does not automatically handle the exception.";
    case "m3d-uncaught":
      return "Look at the type relationship.";
    default:
      return "Not quite — trace the propagation again.";
  }
}

function diagnosticIncorrectExplanation(response: TaskResponseData): string {
  if (response.type !== "single_choice") return DIAGNOSTIC_CORE;
  switch (response.selectedOptionId) {
    case "m3d-here":
      return `\`readProfileFile()\` does create and throw the \`FileNotFoundException\` — but throwing an exception and handling one are separate steps. This method has no \`catch\` clause of its own, so execution doesn't stop here. ${DIAGNOSTIC_CORE}`;
    case "m3d-caller":
      return `\`loadProfile()\` is the immediate caller of \`readProfileFile()\`, but being the immediate caller doesn't automatically mean it handles the exception — \`loadProfile()\` has no \`catch\` clause either, so it keeps propagating upward, past it. ${DIAGNOSTIC_CORE}`;
    case "m3d-uncaught":
      return `\`FileNotFoundException\` is a subtype of \`IOException\` — a \`catch\` clause doesn't need to name the exact thrown type, a compatible supertype is enough to handle it. So \`catch (IOException e)\` in \`start()\` does match. ${DIAGNOSTIC_CORE}`;
    default:
      return DIAGNOSTIC_CORE;
  }
}

export const module3DiagnosticTask: Task = {
  id: "m3-diagnostic",
  moduleId: "module-3",
  caseLabel: "Case file: The Escaping Exception",
  title: "Call Chains & Propagation",
  learningObjective:
    "Understand that an uncaught exception propagates up the call chain to its caller, continuing until a compatible handler is found — and that a handler doesn't need to name the exact thrown type, just a compatible supertype.",
  misconception:
    "Assuming an exception is handled in the method where it's thrown, or that the immediate caller must contain the handler, rather than tracing propagation up through the full call chain until a compatible `catch` clause is found.",
  code: `void start() {
    try {
        loadProfile();
    } catch (IOException e) {
        System.out.println("could not load profile");
    }
}

void loadProfile() throws IOException {
    readProfileFile();
}

void readProfileFile() throws FileNotFoundException {
    throw new FileNotFoundException();
}`,
  hierarchy: [
    { label: "Exception", depth: 0 },
    { label: "IOException", depth: 1 },
    { label: "FileNotFoundException", depth: 2 },
  ],
  callChainTrail: [{ methodName: "start()" }, { methodName: "loadProfile()" }, { methodName: "readProfileFile()", isOrigin: true }],
  orientationNote:
    "An exception does not always get handled in the method where it occurs. Follow the calls below and decide where this exception is eventually handled.",
  question: "Where is the `FileNotFoundException` handled?",
  answer: {
    type: "single_choice",
    data: {
      submitLabel: "Check my answer",
      options: [
        { id: "m3d-here", label: "Inside `readProfileFile()`, because that is where it is thrown" },
        { id: "m3d-caller", label: "Inside `loadProfile()`, because it is the immediate caller" },
        { id: "m3d-start", label: "In `start()` by `catch (IOException e)`" },
        { id: "m3d-uncaught", label: "It remains uncaught because there is no `catch (FileNotFoundException e)`" },
      ],
      correctOptionId: "m3d-start",
    },
  },
  feedback: {
    correctTitle: "Correct — you followed it all the way up.",
    correctExplanation: DIAGNOSTIC_CORE,
    incorrectTitle: "Not quite — trace the propagation again.",
    incorrectExplanation: DIAGNOSTIC_CORE,
    getIncorrectTitle: diagnosticIncorrectTitle,
    getIncorrectExplanation: diagnosticIncorrectExplanation,
    keyRule: PROPAGATION_KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content:
        "`readProfileFile()` has no `catch` clause, so Java doesn't stop there. Which method called it, and does that method have a `catch` clause of its own?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. `readProfileFile()` throws `FileNotFoundException` — but it has no `catch` clause, so it can't handle it there.\n2. Java looks at whoever called `readProfileFile()`: that's `loadProfile()`. It has no `catch` clause either.\n3. Java looks at whoever called `loadProfile()`: that's `start()`. It has `catch (IOException e)`.\n4. `FileNotFoundException` is a subtype of `IOException`, so this `catch` clause matches — the exception is handled in `start()`.",
      keyRule: PROPAGATION_KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "Think of it like passing a problem up a chain of command: if you can't solve it, you hand it to whoever asked you to do the work. `readProfileFile()` can't handle it, so it hands it to `loadProfile()`. `loadProfile()` can't handle it either, so it hands it to `start()` — and `start()` finally has someone who knows what to do with it.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `void run() {
    try {
        fetchData();
    } catch (Exception e) {
        System.out.println("fetch failed");
    }
}

void fetchData() {
    parseResponse();
}

void parseResponse() throws ParsingException {
    throw new ParsingException();
}
// ParsingException extends Exception — parseResponse() and fetchData()
// both lack a handler, so it propagates all the way up to run().`,
    },
  },
  propagationTrace: [
    { methodName: "readProfileFile()", detail: "throws `FileNotFoundException`", status: "throws" },
    { methodName: "loadProfile()", detail: "no handler — propagates", status: "propagates" },
    { methodName: "start()", detail: "`catch (IOException e)` matches — handled here", status: "handled" },
  ],
};

// --- 2. Transfer task (baseline) ---
//
// Deliberately not "propagate until something catches it" again — here two
// handlers are plausible, so the task tests whether the learner understands
// that propagation stops at the *first* compatible one, rather than
// searching outward for the globally most specific match.

const TRANSFER_CORE =
  "The exception moves back through the active call chain. `process()` is reached before `start()`, and its `catch (IOException e)` already matches `FileNotFoundException`. Once that handler catches the exception, propagation stops, so the outer `FileNotFoundException` handler never receives it.";

function transferIncorrectTitle(response: TaskResponseData): string {
  if (response.type !== "single_choice") return "Check which handler is reached first.";
  switch (response.selectedOptionId) {
    case "m3t-both":
      return "Only one handler ever runs.";
    case "m3t-neither":
      return "One of these handlers does match.";
    default:
      return "Check which handler is reached first.";
  }
}

function transferIncorrectExplanation(response: TaskResponseData): string {
  if (response.type !== "single_choice") return TRANSFER_CORE;
  switch (response.selectedOptionId) {
    case "m3t-outer":
      return `\`catch (FileNotFoundException e)\` in \`start()\` does name the exact type — but Java doesn't keep searching the whole call chain for the most specific handler anywhere in the program. ${TRANSFER_CORE}`;
    case "m3t-both":
      return `Only one \`catch\` clause ever runs for a single thrown exception — once a handler catches it, the exception is considered handled and execution moves on from there, it doesn't also trigger another \`catch\` block further out. ${TRANSFER_CORE}`;
    case "m3t-neither":
      return `This exception is caught, not left to propagate all the way out — \`process()\`'s \`catch (IOException e)\` matches it, since \`FileNotFoundException\` is a subtype of \`IOException\`. ${TRANSFER_CORE}`;
    default:
      return TRANSFER_CORE;
  }
}

export const module3TransferTask: Task = {
  id: "m3-transfer",
  moduleId: "module-3",
  caseLabel: "Case file: The First Safe Landing",
  title: "Call Chains & Propagation — Transfer",
  learningObjective:
    "Recognize that propagation stops at the first compatible handler encountered on the way back through the call chain, not the most specific handler anywhere in the program.",
  misconception:
    "Assuming Java searches the entire call chain for the most specific matching `catch` clause, rather than stopping at the first compatible one it reaches while propagating outward.",
  code: `void start() {
    try {
        process();
    } catch (FileNotFoundException e) {
        System.out.println("outer handler");
    }
}

void process() {
    try {
        readFile();
    } catch (IOException e) {
        System.out.println("inner handler");
    }
}

void readFile() throws FileNotFoundException {
    throw new FileNotFoundException();
}`,
  hierarchy: [
    { label: "IOException", depth: 0 },
    { label: "FileNotFoundException", depth: 1 },
  ],
  callChainTrail: [{ methodName: "start()" }, { methodName: "process()" }, { methodName: "readFile()", isOrigin: true }],
  orientationNote:
    "Now several methods are involved again, but more than one handler looks relevant. Decide which one actually receives the exception.",
  question: "Which `catch` clause handles the `FileNotFoundException`?",
  answer: {
    type: "single_choice",
    data: {
      options: [
        { id: "m3t-inner", label: "`catch (IOException e)` inside `process()`" },
        { id: "m3t-outer", label: "`catch (FileNotFoundException e)` inside `start()`" },
        { id: "m3t-both", label: "Both `catch` clauses run" },
        { id: "m3t-neither", label: "Neither `catch` clause runs" },
      ],
      correctOptionId: "m3t-inner",
    },
  },
  feedback: {
    correctTitle: "Correct — the nearest matching handler wins.",
    correctExplanation:
      "`readFile()` throws `FileNotFoundException` and has no handler of its own, so it propagates to its caller, `process()`. `process()` has `catch (IOException e)` — and since `FileNotFoundException` is a subtype of `IOException`, that clause already matches. Propagation stops there: the exception never reaches `start()`, so its `catch (FileNotFoundException e)` never runs.",
    incorrectTitle: "Check which handler is reached first.",
    incorrectExplanation: TRANSFER_CORE,
    getIncorrectTitle: transferIncorrectTitle,
    getIncorrectExplanation: transferIncorrectExplanation,
    keyRule: FIRST_MATCH_KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content:
        "Trace it from where it's thrown, outward: does `process()` have a `catch` clause that matches `FileNotFoundException`? If it does, does Java keep looking past it for something even more specific?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. `readFile()` throws `FileNotFoundException` and has no `catch` clause of its own.\n2. Java looks at its caller, `process()` — which has `catch (IOException e)`.\n3. `FileNotFoundException` is a subtype of `IOException`, so this clause matches immediately.\n4. Java stops right there — it never continues on to check `start()`'s `catch (FileNotFoundException e)`, even though that one names the exact type.",
      keyRule: FIRST_MATCH_KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "It's like knocking on doors going up a hallway: you stop at the first door that opens, even if a door further down the hall would've been an even better fit. Java doesn't keep walking past an open door to look for a more specific one.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `void run() {
    try {
        step1();
    } catch (ArithmeticException e) {
        System.out.println("outer handler");
    }
}

void step1() {
    try {
        step2();
    } catch (RuntimeException e) {
        System.out.println("inner handler");
    }
}

void step2() {
    throw new ArithmeticException();
}
// ArithmeticException extends RuntimeException — step1()'s broader
// catch (RuntimeException e) already matches and stops the exception
// there, even though run()'s catch names the exact type.`,
    },
  },
  propagationTrace: [
    { methodName: "readFile()", detail: "throws `FileNotFoundException`", status: "throws" },
    { methodName: "process()", detail: "`catch (IOException e)` matches — handled here", status: "handled" },
  ],
  isTransferTask: true,
};

// --- 3. Transfer retry variant ("comparable case") ---
//
// Served only on the one allowed retry, and only after m3-transfer was
// answered incorrectly (see retryVariant wiring below / getComparableRetryTask
// in content/modules.ts). A fresh hierarchy and fresh method names, and
// deliberately back to the simpler "propagate until something catches it"
// shape (one handler, nothing in between) rather than the transfer task's
// two-plausible-handlers trap — a comparable case reinforcing the base
// rule, not a second attempt at the exact same trap.

const RETRY_CORE =
  "`validate()` throws `ValidationException`. There is no matching handler there, so the exception propagates back to `save()`. `save()` also has no handler, so it continues to `run()`. The `catch (ApplicationException e)` clause matches because `ValidationException` is a subtype of `ApplicationException`, so the exception is handled there.";

function retryIncorrectTitle(response: TaskResponseData): string {
  if (response.type !== "single_choice") return "Not quite — trace the propagation again.";
  switch (response.selectedOptionId) {
    case "m3r-here":
      return "Not quite — throwing and handling are separate steps.";
    case "m3r-caller":
      return "Not quite — the immediate caller does not automatically handle the exception.";
    case "m3r-uncaught":
      return "Look at the type relationship.";
    default:
      return "Not quite — trace the propagation again.";
  }
}

function retryIncorrectExplanation(response: TaskResponseData): string {
  if (response.type !== "single_choice") return RETRY_CORE;
  switch (response.selectedOptionId) {
    case "m3r-here":
      return `\`validate()\` does create and throw the \`ValidationException\` — but throwing an exception and handling one are separate steps. This method has no \`catch\` clause of its own, so execution doesn't stop here. ${RETRY_CORE}`;
    case "m3r-caller":
      return `\`save()\` is the immediate caller of \`validate()\`, but being the immediate caller doesn't automatically mean it handles the exception — \`save()\` has no \`catch\` clause either, so it keeps propagating upward, past it. ${RETRY_CORE}`;
    case "m3r-uncaught":
      return `\`ValidationException\` is a subtype of \`ApplicationException\` — a \`catch\` clause doesn't need to name the exact thrown type, a compatible supertype is enough to handle it. So \`catch (ApplicationException e)\` in \`run()\` does match. ${RETRY_CORE}`;
    default:
      return RETRY_CORE;
  }
}

export const module3TransferRetryTask: Task = {
  id: "m3-transfer-retry",
  moduleId: "module-3",
  caseLabel: "Case file: The Skipped Layer",
  title: "Call Chains & Propagation — A Comparable Case",
  learningObjective: "Apply the same propagation rule — no local handler, continue to the caller — to a new hierarchy and call chain.",
  misconception:
    "Assuming an exception is handled in the method where it's thrown or by its immediate caller, rather than tracing propagation up through the full call chain until a compatible `catch` clause is found.",
  code: `void run() {
    try {
        save();
    } catch (ApplicationException e) {
        System.out.println("save failed");
    }
}

void save() {
    validate();
}

void validate() throws ValidationException {
    throw new ValidationException();
}`,
  hierarchy: [
    { label: "ApplicationException", depth: 0 },
    { label: "ValidationException", depth: 1 },
  ],
  callChainTrail: [{ methodName: "run()" }, { methodName: "save()" }, { methodName: "validate()", isOrigin: true }],
  orientationNote: "Same idea, a new call chain. Follow the calls below and decide where this exception is eventually handled.",
  question: "Where is the exception handled?",
  answer: {
    type: "single_choice",
    data: {
      options: [
        { id: "m3r-here", label: "Inside `validate()`, because that is where it is thrown" },
        { id: "m3r-caller", label: "Inside `save()`, because it is the immediate caller" },
        { id: "m3r-run", label: "In `run()` by `catch (ApplicationException e)`" },
        { id: "m3r-uncaught", label: "It remains uncaught because there is no `catch (ValidationException e)`" },
      ],
      correctOptionId: "m3r-run",
    },
  },
  feedback: {
    correctTitle: "Correct — same rule, new names.",
    correctExplanation: RETRY_CORE,
    incorrectTitle: "Not quite — trace the propagation again.",
    incorrectExplanation: RETRY_CORE,
    getIncorrectTitle: retryIncorrectTitle,
    getIncorrectExplanation: retryIncorrectExplanation,
    keyRule: PROPAGATION_KEY_RULE,
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "`validate()` has no `catch` clause, so Java doesn't stop there. Which method called it, and does that method have a `catch` clause of its own?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. `validate()` throws `ValidationException` — but it has no `catch` clause, so it can't handle it there.\n2. Java looks at whoever called `validate()`: that's `save()`. It has no `catch` clause either.\n3. Java looks at whoever called `save()`: that's `run()`. It has `catch (ApplicationException e)`.\n4. `ValidationException` is a subtype of `ApplicationException`, so this `catch` clause matches — the exception is handled in `run()`.",
      keyRule: PROPAGATION_KEY_RULE,
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        "Same chain-of-command idea: if a method can't solve the problem, it hands it to whoever called it. `validate()` can't handle it, so it hands it to `save()`. `save()` can't handle it either, so it hands it to `run()` — which finally has a matching `catch` clause.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `void main() {
    try {
        loadSettings();
    } catch (ConfigException e) {
        System.out.println("using defaults");
    }
}

void loadSettings() {
    parseSettingsFile();
}

void parseSettingsFile() throws MissingKeyException {
    throw new MissingKeyException();
}
// MissingKeyException extends ConfigException — loadSettings() has no
// handler, so it propagates all the way up to main().`,
    },
  },
  propagationTrace: [
    { methodName: "validate()", detail: "throws `ValidationException`", status: "throws" },
    { methodName: "save()", detail: "no handler — propagates", status: "propagates" },
    { methodName: "run()", detail: "`catch (ApplicationException e)` matches — handled here", status: "handled" },
  ],
  isTransferTask: true,
};

// Wire the retry-only swap (same pattern as Module 2's spec §11): a wrong
// answer on the baseline transfer task serves this comparable case on the
// one allowed retry — a new hierarchy and method names, not a repeat of
// m3-transfer's code. See getComparableRetryTask in content/modules.ts.
module3TransferTask.retryVariant = module3TransferRetryTask;

export const module3Tasks: Task[] = [module3DiagnosticTask, module3TransferTask, module3TransferRetryTask];
