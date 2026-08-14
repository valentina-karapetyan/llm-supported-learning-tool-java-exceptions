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
