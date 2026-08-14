// src/content/module2-catch-order.ts
//
// Full task content for Module 2 — "Catch Order & Specificity". Same
// architecture as Module 1, reused as-is (Task shape, TaskRenderer,
// FeedbackCard, AiSupportPanel, TransferTaskFlow all work unchanged); only
// the content and the `catch_order` task type are new.
//
// Unlike Module 1, this isn't a runtime control-flow trace — catch clause
// order is a static/compile-time rule (an unreachable catch block is a
// compiler error in Java, not just bad style), so these tasks have no
// replayScript. FeedbackCard falls back to a plain code block for them.
//
// No high-confidence "stretch" variant yet for this module — per the build
// spec's own framing (§6.3: "optional, author after baseline is
// validated"), that's a later refinement, not a requirement.

import type { Task } from "../types/content";
import { SUPPORT_TITLES } from "../types/content";

// --- 1. Diagnostic task ---

export const module2DiagnosticTask: Task = {
  id: "m2-diagnostic",
  moduleId: "module-2",
  caseLabel: "Case file: The Unreachable Catch",
  title: "Catch Order & Specificity",
  learningObjective:
    "Understand that catch clauses are checked top-to-bottom, so the most specific exception type must be listed before its more general supertypes.",
  misconception:
    "Assuming catch clause order doesn't matter, or that a general Exception catch can safely be listed before a more specific exception type.",
  code: `void loadConfig() {
    try {
        readConfigFile();
        System.out.println("config loaded");
    }
    // catch clauses go here, in the order you choose
}
// readConfigFile() can throw FileNotFoundException.
// Class hierarchy:
// FileNotFoundException extends IOException extends Exception.`,
  question: "Put the catch clauses in the order they need to appear below the try block.",
  answer: {
    type: "catch_order",
    data: {
      clauses: [
        { id: "c1", label: "catch (Exception e)" },
        { id: "c2", label: "catch (FileNotFoundException e)" },
        { id: "c3", label: "catch (IOException e)" },
      ],
      correctOrder: ["c2", "c3", "c1"],
    },
  },
  feedback: {
    correctTitle: "Correct — most specific first.",
    correctExplanation:
      "Java checks catch clauses top-to-bottom and runs the first one that matches. FileNotFoundException is the most specific type here, so it has to come first, then its parent IOException, then the general Exception last.",
    incorrectTitle: "Not quite — think about the class hierarchy.",
    incorrectExplanation:
      "FileNotFoundException extends IOException, which extends Exception. If a broader type like Exception is listed before FileNotFoundException, it would catch everything first — including FileNotFoundException — which makes the more specific clause below it pointless. Java actually refuses to compile that: an unreachable catch block is a compile error, not just bad style.",
    keyRule:
      "Catch clauses are checked top-to-bottom; the most specific exception type must be listed before its more general supertypes, or the compiler rejects the now-unreachable clause.",
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "Which of these three exception types is a subtype of another one in the list? Where does the most specific one need to go?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. FileNotFoundException extends IOException, and IOException extends Exception — so they form a chain, most specific to least.\n2. Java checks catch clauses in the order they're written and stops at the first match.\n3. If Exception came first, it would catch a FileNotFoundException too — so the FileNotFoundException clause after it could never run.\n4. So the order has to go narrowest to broadest: FileNotFoundException, then IOException, then Exception.",
      keyRule: "The most specific exception type must be listed before its more general supertypes.",
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content:
        'Think of it like a lost-and-found: if you check the general "anything" box first, you\'ll never get to the specific "red backpack" box, because the general box already took it. The most specific box has to be checked first.',
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    connectToServer();
} catch (SocketException e) {
    System.out.println("connection lost");
} catch (IOException e) {
    System.out.println("connection failed");
} catch (Exception e) {
    System.out.println("something else went wrong");
}
// SocketException extends IOException extends Exception —
// so it has to be listed first, IOException next, Exception last.`,
    },
  },
  articulationPrompt: "In one sentence — why can't `catch (Exception e)` come before `catch (FileNotFoundException e)`?",
  // No replayScript — catch order is a static/compile-time rule, so there's
  // nothing here for ExecutionReplay to animate. FeedbackCard shows a plain
  // code block instead (see hasReplayScript in types/content.ts).
};

// --- 2. Transfer task ---
//
// A different exception hierarchy and scenario entirely (parsing, not file
// I/O) — same rule, no shared surface details with the diagnostic beyond
// "three catch clauses in a chain."

export const module2TransferTask: Task = {
  id: "m2-transfer",
  moduleId: "module-2",
  caseLabel: "Case file: The Ignored Format Error",
  title: "Catch Order & Specificity — Transfer",
  learningObjective: "Apply the same ordering rule to a new exception hierarchy.",
  misconception:
    "Assuming catch clause order doesn't matter, or that a general Exception catch can safely be listed before a more specific exception type.",
  code: `void parseInput() {
    try {
        parseXml();
        System.out.println("parsed successfully");
    }
    // catch clauses go here, in the order you choose
}
// parseXml() can throw SAXParseException.
// Class hierarchy:
// SAXParseException extends SAXException extends Exception.`,
  question: "Put the catch clauses in the order they need to appear below the try block.",
  answer: {
    type: "catch_order",
    data: {
      clauses: [
        { id: "d1", label: "catch (SAXException e)" },
        { id: "d2", label: "catch (SAXParseException e)" },
        { id: "d3", label: "catch (Exception e)" },
      ],
      correctOrder: ["d2", "d1", "d3"],
    },
  },
  feedback: {
    correctTitle: "Correct — same rule, new hierarchy.",
    correctExplanation:
      "SAXParseException is the most specific type, so it goes first, then its parent SAXException, then Exception last — exactly the same shape as before, just different names.",
    incorrectTitle: "Check the hierarchy again.",
    incorrectExplanation:
      "SAXParseException extends SAXException, which extends Exception. Whichever of these is listed first has to be the most specific one — otherwise a broader clause would catch it before the narrower one ever gets a chance.",
    keyRule:
      "Catch clauses are checked top-to-bottom; the most specific exception type must be listed before its more general supertypes, or the compiler rejects the now-unreachable clause.",
  },
  supportContent: {
    hint: {
      supportType: "hint",
      title: SUPPORT_TITLES.hint,
      content: "Same question as before, new names: which type here is the most specific one? Which is the most general?",
    },
    step_by_step: {
      supportType: "step_by_step",
      title: SUPPORT_TITLES.step_by_step,
      content:
        "1. SAXParseException extends SAXException, and SAXException extends Exception.\n2. Java checks each catch clause in order and stops at the first match.\n3. If a broader clause came first, the narrower one after it could never run.\n4. So the order has to go narrowest to broadest: SAXParseException, then SAXException, then Exception.",
      keyRule: "The most specific exception type must be listed before its more general supertypes.",
    },
    simpler_explanation: {
      supportType: "simpler_explanation",
      title: SUPPORT_TITLES.simpler_explanation,
      content: "Same lost-and-found idea: check the most specific box first, or the general box swallows everything before you get there.",
    },
    similar_example: {
      supportType: "similar_example",
      title: SUPPORT_TITLES.similar_example,
      content: `try {
    lookupUser(username);
} catch (NameNotFoundException e) {
    System.out.println("user not found");
} catch (NamingException e) {
    System.out.println("directory error");
} catch (Exception e) {
    System.out.println("unexpected error");
}
// NameNotFoundException extends NamingException extends Exception —
// narrowest first, broadest last, same as always.`,
    },
  },
  articulationPrompt: "In one sentence — what do SAXParseException and FileNotFoundException from before have in common?",
  isTransferTask: true,
};

export const module2Tasks: Task[] = [module2DiagnosticTask, module2TransferTask];
