// src/components/tasks/shuffle.ts
//
// Shared by ExecutionTraceTask and CatchOrderTask (and any future
// ordering-style task type): shuffles the initial display order of a set
// of ids so a learner can't infer anything from how they happened to be
// authored, and content authors don't have to remember to scramble their
// `cards`/`clauses` arrays by hand.

export function shuffledIds(items: { id: string }[]): string[] {
  const ids = items.map((item) => item.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

function idsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

// Same shuffle, but reshuffles for as long as the result exactly matches
// `avoid` — used by CatchOrderTask so a prediction task never starts
// already correctly ordered (on first load or on any later remount), which
// would hand the learner the answer for free. Fewer than 2 items only ever
// have one possible order, so `avoid` can't be avoided — return immediately
// rather than loop forever.
export function shuffledIdsAvoiding(items: { id: string }[], avoid: string[]): string[] {
  if (items.length < 2) return shuffledIds(items);
  let ids = shuffledIds(items);
  while (idsEqual(ids, avoid)) {
    ids = shuffledIds(items);
  }
  return ids;
}
