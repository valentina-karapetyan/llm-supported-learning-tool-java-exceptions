// src/components/GuidedTour.tsx
//
// A live, spotlight-style walkthrough overlaid on the REAL task interface —
// built to replace a separate static "how this works" screen (build spec
// §2), which required the learner to read instructions in the abstract and
// then remember them once looking at the actual task. This instead
// highlights the real DOM elements one at a time, in place, using plain
// `data-tour-id` attributes on the elements being taught (see TaskScreen.tsx
// and tasks/ExecutionTraceTask.tsx) — no changes to those components'
// props or logic, just an inert marker attribute they already render.
//
// A step can optionally auto-advance the moment the learner actually
// interacts with its target (`advanceOnInteraction`), instead of only ever
// advancing via the "Next" button — e.g. "click an event" advances for real
// once they click one, rather than just being read and dismissed. The
// button is always shown too, so a learner is never blocked on performing
// the exact expected action.

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import styles from "./GuidedTour.module.css";

export interface TourStep {
  targetId: string; // matches an element's data-tour-id attribute
  text: string;
  advanceOnInteraction?: boolean;
}

export interface GuidedTourProps {
  steps: TourStep[];
  onFinish: () => void;
}

interface CalloutPosition {
  top?: number;
  bottom?: number;
  left: number;
}

function computeCalloutPosition(rect: DOMRect): CalloutPosition {
  const CALLOUT_WIDTH = 300;
  const MARGIN = 12;
  const spaceBelow = window.innerHeight - rect.bottom;
  const placeBelow = spaceBelow > 180 || spaceBelow > rect.top;
  let left = rect.left;
  if (left + CALLOUT_WIDTH > window.innerWidth - 16) left = window.innerWidth - CALLOUT_WIDTH - 16;
  if (left < 16) left = 16;
  return placeBelow ? { top: rect.bottom + MARGIN, left } : { bottom: window.innerHeight - rect.top + MARGIN, left };
}

export function GuidedTour({ steps, onFinish }: GuidedTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;

  // Advancing past the last step is never automatic — onFinish only ever
  // fires from the explicit "Skip tour" / "Got it" buttons below, so
  // leaving the tour always reads as a deliberate action.
  const advance = useCallback(() => {
    setStepIndex((i) => (i + 1 < steps.length ? i + 1 : i));
  }, [steps.length]);

  // Track the current target's on-screen position: recompute on step
  // change, and keep following it across resizes/scrolling/layout shifts
  // (e.g. the code panel's replay animation, or the trace list growing as
  // cards are added) so the highlight never drifts away from its target.
  useLayoutEffect(() => {
    let cancelled = false;
    const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.targetId}"]`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });

    function updateRect() {
      if (cancelled) return;
      const target = document.querySelector<HTMLElement>(`[data-tour-id="${step.targetId}"]`);
      setRect(target ? target.getBoundingClientRect() : null);
    }
    updateRect();
    const raf = window.setInterval(updateRect, 150);
    window.addEventListener("resize", updateRect);
    return () => {
      cancelled = true;
      window.clearInterval(raf);
      window.removeEventListener("resize", updateRect);
    };
  }, [step.targetId]);

  // Auto-advance on a real interaction within the target, in addition to
  // the always-visible Next button.
  useEffect(() => {
    if (!step.advanceOnInteraction) return;
    const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.targetId}"]`);
    if (!el) return;
    let firedOnce = false;
    function handleInteraction() {
      if (firedOnce) return;
      firedOnce = true;
      window.setTimeout(advance, 350);
    }
    el.addEventListener("click", handleInteraction, { capture: true });
    return () => el.removeEventListener("click", handleInteraction, { capture: true });
  }, [step.targetId, step.advanceOnInteraction, advance]);

  if (!rect) return null; // target not on screen (yet) — never block the real task underneath

  const position = computeCalloutPosition(rect);

  return (
    <>
      <div
        className={styles.highlight}
        style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }}
      />
      <div className={styles.callout} style={{ top: position.top, bottom: position.bottom, left: position.left }}>
        <p className={styles.stepCount}>
          {stepIndex + 1} of {steps.length}
        </p>
        <p className={styles.text}>{step.text}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.skipButton} onClick={onFinish}>
            Skip tour
          </button>
          <button type="button" className={styles.nextButton} onClick={isLast ? onFinish : advance}>
            {isLast ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </>
  );
}
