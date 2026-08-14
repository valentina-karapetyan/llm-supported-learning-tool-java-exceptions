// src/content/module1-trace-execution.ts
//
// Full task content for Module 1 — "Trace the Execution". Built first and
// completely, per the build spec's build order: no other module is started
// until diagnostic → feedback → AI support → transfer → completion works
// end-to-end here.

import type { Task } from "../types/content";

// --- 1. Diagnostic task ---

export const diagnosticTask: Task = {
  id: "m1-diagnostic",
  moduleId: "module-1",
  caseLabel: "Case file: The Vanishing Line",
  title: "Trace the Execution",
  learningObjective:
    "Understand that a thrown exception skips the remaining statements in the same try block.",
  misconception:
    "Assuming execution continues with later statements in the same try block after an exception is thrown.",
  code: `void start() {
    try {
        first();
        second();
        System.out.println("done");
    } catch (SomeException e) {
        System.out.println("error");
    }
}
// Assume first() throws SomeException.`,
  question: "Drag the events into the order they actually occur.",
  answer: {
    type: "execution_trace",
    data: {
      cards: [
        { id: "e1", label: "`first()` starts" },
        { id: "e2", label: "An exception is thrown inside `first()`" },
        { id: "e3", label: "`second()` starts" },
        { id: "e4", label: '"done" is printed' },
        { id: "e5", label: "The matching `catch` block runs" },
      ],
      // second() and "done" never happen — the correct sequence has only 3 events
      correctOrder: ["e1", "e2", "e5"],
    },
  },
  feedback: {
    correctTitle: "Correct — you traced the exceptional control flow.",
    correctExplanation:
      "Once first() throws the exception, Java skips the remaining statements in the try block and executes the matching catch block directly.",
    incorrectTitle: "Not quite — follow the control flow.",
    incorrectExplanation:
      'When first() throws an exception, Java does not continue with the remaining statements in the same try block. second() and the "done" message are skipped entirely. Control moves straight to the matching catch clause.',
    keyRule:
      "An exception interrupts the remaining statements in the current try block and transfers control to a matching catch clause.",
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: "A nudge",
      content:
        "Look at exactly where the exception is thrown. What normally happens to code that comes *after* the point where something goes wrong?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: "Step by step",
      content:
        "1. first() runs and throws SomeException.\n2. Java immediately stops executing the try block — it does not finish first()'s remaining code or move on to second().\n3. Java looks for a catch clause matching SomeException.\n4. The catch (SomeException e) block runs and prints \"error\".",
      keyRule: "An exception interrupts the remaining statements in the current try block.",
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: "In simple terms",
      content:
        'Think of the try block as a checklist. If something goes wrong on one item, Java doesn\'t keep ticking off the rest of the list — it jumps straight to the "if something goes wrong" plan (the catch block).',
    },
    similar_example: {
      supportType: "similar_example",
      title: "A similar example",
      content: `void checkout() {
    try {
        validateCart();
        chargeCard();
        System.out.println("order placed");
    } catch (PaymentException e) {
        System.out.println("payment failed");
    }
}
// If validateCart() throws PaymentException, chargeCard() and
// "order placed" never run — Java jumps straight to the catch block.`,
    },
  },
  articulationPrompt: "In one sentence — why do you think second() never runs here?",
  replayScript: [
    { lineNumber: 2, state: "active" }, //     try {
    { lineNumber: 3, state: "throws" }, //         first();
    { lineNumber: 4, state: "skipped" }, //         second();
    { lineNumber: 5, state: "skipped" }, //         System.out.println("done");
    { lineNumber: 6, state: "handled" }, //     } catch (SomeException e) {
    { lineNumber: 7, state: "handled" }, //         System.out.println("error");
  ],
};

// --- 2. Transfer task (baseline) ---

export const transferTaskBaseline: Task = {
  id: "m1-transfer",
  moduleId: "module-1",
  caseLabel: "Case file: The Interrupted Load",
  title: "Trace the Execution — Transfer",
  learningObjective: "Apply the same rule to a new scenario with different method and output names.",
  misconception:
    "Assuming execution continues with later statements in the same try block after an exception is thrown.",
  code: `void load() {
    try {
        loadProfile();
        showDashboard();
        System.out.println("ready");
    } catch (IOException e) {
        System.out.println("loading failed");
    }
}
// Assume loadProfile() throws IOException.`,
  question: "Drag the events into the order they actually occur.",
  answer: {
    type: "execution_trace",
    data: {
      cards: [
        { id: "t1", label: "`loadProfile()` starts" },
        { id: "t2", label: "An exception is thrown inside `loadProfile()`" },
        { id: "t3", label: "`showDashboard()` starts" },
        { id: "t4", label: '"ready" is printed' },
        { id: "t5", label: "The matching `catch` block runs" },
      ],
      correctOrder: ["t1", "t2", "t5"],
    },
  },
  feedback: {
    correctTitle: "Correct — same rule, new scenario.",
    correctExplanation:
      "loadProfile() throws before showDashboard() gets a chance to run, so Java jumps straight to the catch block, exactly as before.",
    incorrectTitle: "Check the control flow again.",
    incorrectExplanation:
      'showDashboard() and "ready" never execute — loadProfile()\'s exception sends control straight to the catch block, skipping the rest of the try block.',
    keyRule:
      "An exception interrupts the remaining statements in the current try block and transfers control to a matching catch clause.",
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: "A nudge",
      content: "Which method call comes right after the one that fails? Does it get a chance to start?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: "Step by step",
      content:
        '1. loadProfile() runs and throws IOException.\n2. Java abandons the rest of the try block immediately.\n3. showDashboard() and the "ready" message never run.\n4. The catch (IOException e) block runs and prints "loading failed".',
      keyRule: "An exception interrupts the remaining statements in the current try block.",
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: "In simple terms",
      content:
        "Same idea as before: once one step in the list fails, Java stops going through the list and jumps to the backup plan.",
    },
    similar_example: {
      supportType: "similar_example",
      title: "A similar example",
      content: `void save() {
    try {
        validateInput();
        writeToDisk();
        System.out.println("saved");
    } catch (ValidationException e) {
        System.out.println("save aborted");
    }
}
// If validateInput() throws, writeToDisk() and "saved" never run.`,
    },
  },
  articulationPrompt: "In one sentence — what do loadProfile() and first() from before have in common?",
  isTransferTask: true,
  replayScript: [
    { lineNumber: 2, state: "active" }, //     try {
    { lineNumber: 3, state: "throws" }, //         loadProfile();
    { lineNumber: 4, state: "skipped" }, //         showDashboard();
    { lineNumber: 5, state: "skipped" }, //         System.out.println("ready");
    { lineNumber: 6, state: "handled" }, //     } catch (IOException e) {
    { lineNumber: 7, state: "handled" }, //         System.out.println("loading failed");
  ],
};

// --- 3. Transfer task variant for high confidence ---
//
// Per the build spec's "flow-adaptive transfer retry": if the diagnostic was
// answered correctly with "high" confidence, this variant is served instead
// of the baseline — same rule, slightly less obvious because the failing
// call is one line deeper into the try block instead of the very first
// statement.

export const transferTaskStretch: Task = {
  id: "m1-transfer-stretch",
  moduleId: "module-1",
  caseLabel: "Case file: The Quiet Failure",
  title: "Trace the Execution — A Trickier Case",
  learningObjective: "Apply the same rule when the failing call is less obviously the risky one.",
  misconception:
    "Assuming execution continues with later statements in the same try block after an exception is thrown.",
  code: `void processOrder() {
    try {
        System.out.println("checking stock");
        reserveStock();     // throws StockException here
        System.out.println("stock reserved");
        emailReceipt();
        System.out.println("order complete");
    } catch (StockException e) {
        System.out.println("out of stock");
    }
}`,
  question: "Drag the events into the order they actually occur.",
  answer: {
    type: "execution_trace",
    data: {
      cards: [
        { id: "s1", label: '"checking stock" is printed' },
        { id: "s2", label: "`reserveStock()` throws StockException" },
        { id: "s3", label: '"stock reserved" is printed' },
        { id: "s4", label: "`emailReceipt()` runs" },
        { id: "s5", label: '"out of stock" is printed' },
      ],
      correctOrder: ["s1", "s2", "s5"],
    },
  },
  feedback: {
    correctTitle: "Correct — you caught the less obvious case.",
    correctExplanation:
      "The first println runs fine — the failure is one call later, inside reserveStock(). Everything after that point in the try block, including emailReceipt(), is skipped.",
    incorrectTitle: "Look again at where exactly the exception happens.",
    incorrectExplanation:
      '"checking stock" does print — that line runs before the exception. But once reserveStock() throws, everything after it in the try block is skipped, including "stock reserved" and emailReceipt().',
    keyRule:
      "An exception interrupts the remaining statements in the current try block and transfers control to a matching catch clause — everything before the failing line still runs normally.",
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: "A nudge",
      content:
        "Not every line in the try block is equally risky — find the exact line that throws, then think about what comes only before it.",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: "Step by step",
      content:
        '1. "checking stock" prints — this happens before anything risky.\n2. reserveStock() runs and throws StockException.\n3. Java abandons the rest of the try block: "stock reserved" and emailReceipt() never happen.\n4. catch (StockException e) runs and prints "out of stock".',
      keyRule: "Everything before the failing line still runs; everything after it in the same try block does not.",
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: "In simple terms",
      content:
        "The checklist analogy still holds — some items on the list are fine, and then one item fails. Java completes the fine items, then stops at the failure and skips straight to the backup plan.",
    },
    similar_example: {
      supportType: "similar_example",
      title: "A similar example",
      content: `void publishPost() {
    System.out.println("draft saved");
    validateContent(); // throws here
    System.out.println("content ok");
    notifyFollowers();
}
// "draft saved" already printed before this snippet's try block starts;
// once validateContent() throws, everything after it inside the try is skipped.`,
    },
  },
  articulationPrompt: 'In one sentence — why does "checking stock" still print, but "stock reserved" doesn\'t?',
  isTransferTask: true,
  replayScript: [
    { lineNumber: 2, state: "active" }, //     try {
    { lineNumber: 3, state: "active" }, //         System.out.println("checking stock");
    { lineNumber: 4, state: "throws" }, //         reserveStock();
    { lineNumber: 5, state: "skipped" }, //         System.out.println("stock reserved");
    { lineNumber: 6, state: "skipped" }, //         emailReceipt();
    { lineNumber: 7, state: "skipped" }, //         System.out.println("order complete");
    { lineNumber: 8, state: "handled" }, //     } catch (StockException e) {
    { lineNumber: 9, state: "handled" }, //         System.out.println("out of stock");
  ],
};

// Wire the flow-adaptive swap onto the baseline transfer task, so any code
// that resolves "the transfer task for this module" can find the variant
// without a separate lookup table.
transferTaskBaseline.transferVariantForHighConfidence = transferTaskStretch;

export const module1Tasks: Task[] = [diagnosticTask, transferTaskBaseline, transferTaskStretch];
