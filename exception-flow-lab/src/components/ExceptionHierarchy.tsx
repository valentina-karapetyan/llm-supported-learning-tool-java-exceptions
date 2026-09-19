// src/components/ExceptionHierarchy.tsx
//
// Renders an exception class hierarchy as a small tree, entirely separate
// from any code block — Case 2 treats "which types are related, and how" as
// task information the learner reads, not Java syntax to parse out of a
// comment. Reused for every Case 2 task that needs one (diagnostic,
// transfer, and its retry variant) instead of splicing the same information
// into a trailing code comment.
//
// Build spec §4: made visually more prominent than the original plain
// indented list (bigger card, tree connectors, larger type chips) — every
// hierarchy authored across the content model is a straight chain (each
// node's depth is exactly one more than the previous, no branching), so a
// single `└──` connector per non-root node is enough to read as a real tree
// without needing sibling/branch handling this data never actually has.

import type { HierarchyNode } from "../types/content";
import styles from "./ExceptionHierarchy.module.css";

export interface ExceptionHierarchyProps {
  nodes: HierarchyNode[]; // ordered most general (depth 0) to most specific
}

export function ExceptionHierarchy({ nodes }: ExceptionHierarchyProps) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>Exception hierarchy</p>
      <ol className={styles.list}>
        {nodes.map((node) => (
          <li key={node.label} className={styles.row}>
            <span className={styles.indent} aria-hidden="true" style={{ width: `${Math.max(node.depth - 1, 0) * 1.4}rem` }} />
            {node.depth > 0 && (
              <span className={styles.connector} aria-hidden="true">
                └──
              </span>
            )}
            <code className={styles.type}>{node.label}</code>
          </li>
        ))}
      </ol>
    </div>
  );
}
