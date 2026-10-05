// src/hooks/useStepReplay.ts
//
// Shared step-through-time controller for ExecutionReplay and
// PropagationReplay: both reveal a fixed-length script one step at a time,
// automatically, then offer a way to watch it again. Factored out so the two
// components' timer/cancellation logic (previously duplicated near-verbatim)
// can't drift, and so both get the same manual Previous/Next stepping for
// free.
//
// Manual stepping (goToPrevious/goToNext) cancels any in-flight autoplay via
// cancelAutoplayRef rather than by changing a dependency the effect watches —
// changing revealCount outside the effect must not itself restart it, only
// `replay()` (which bumps runId) should do that.

import { useEffect, useMemo, useRef, useState } from "react";

export interface StepReplayControls {
  revealCount: number;
  atStart: boolean;
  atEnd: boolean;
  goToPrevious: () => void;
  goToNext: () => void;
  replay: () => void;
}

function usesReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useStepReplay(totalSteps: number, stepDelayMs: number): StepReplayControls {
  const reducedMotion = useMemo(() => usesReducedMotion(), []);
  const [revealCount, setRevealCount] = useState(reducedMotion ? totalSteps : 0);
  const [runId, setRunId] = useState(0);
  const cancelRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (reducedMotion) {
      setRevealCount(totalSteps);
      return;
    }
    setRevealCount(0);
    if (totalSteps === 0) return;

    let cancelled = false;
    let step = 0;
    let timerId: number;

    const advance = () => {
      if (cancelled) return;
      step += 1;
      setRevealCount(step);
      if (step < totalSteps) {
        timerId = window.setTimeout(advance, stepDelayMs);
      }
    };
    timerId = window.setTimeout(advance, stepDelayMs);
    cancelRef.current = () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalSteps, reducedMotion, runId, stepDelayMs]);

  function stepTo(next: number) {
    cancelRef.current();
    setRevealCount(Math.max(0, Math.min(totalSteps, next)));
  }

  return {
    revealCount,
    atStart: revealCount <= 0,
    atEnd: revealCount >= totalSteps,
    goToPrevious: () => stepTo(revealCount - 1),
    goToNext: () => stepTo(revealCount + 1),
    replay: () => setRunId((id) => id + 1),
  };
}
