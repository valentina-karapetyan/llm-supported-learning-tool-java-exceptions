// src/components/ExceptionHierarchy.tsx
//
// Renders an exception class hierarchy as a small indented list, entirely
// separate from any code block — Case 2 treats "which types are related,
// and how" as task information the learner reads, not Java syntax to parse
// out of a comment. Reused for every Case 2 task that needs one (diagnostic,
// transfer, and its retry variant) instead of splicing the same information
// into a trailing code comment.

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
          <li key={node.label} className={styles.row} style={{ paddingLeft: `${node.depth * 1.25}rem` }}>
            {node.depth > 0 && (
              <span className={styles.arrow} aria-hidden="true">
                ↳
              </span>
            )}
            <code className={styles.type}>{node.label}</code>
          </li>
        ))}
      </ol>
    </div>
  );
}
