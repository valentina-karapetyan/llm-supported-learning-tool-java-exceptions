// src/content/guidedTours.ts
//
// Step data for GuidedTour.tsx. Kept content-only (no JSX) so it lives
// alongside the rest of the authored copy rather than inline in App.tsx.
// Explains the INTERACTION only — no Java exception rule, nothing that
// reveals m1-diagnostic's answer (build spec §2).

import type { TourStep } from "../components/GuidedTour";

export const module1DiagnosticTourSteps: TourStep[] = [
  {
    targetId: "task-code",
    text: "Read the code below. This method runs once — that's the execution you're about to trace.",
  },
  {
    targetId: "trace-pool",
    text: "Click an event here if you think it actually happens.",
    advanceOnInteraction: true,
  },
  {
    targetId: "trace-list",
    text: "It lands here, numbered. Click more events above if you think they happen too — use ▲▼ to reorder one, or Remove to take it back out.",
  },
  {
    targetId: "trace-actions",
    text: "Submit only once you're confident. The explanation shows right after, with no way back to change your answer first.",
  },
];
