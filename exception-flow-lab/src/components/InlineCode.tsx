// src/components/InlineCode.tsx
//
// Authored content sometimes uses markdown-style `code` spans, e.g.
// "`first()` starts". This renders those as real React elements (a plain
// split + map), not via dangerouslySetInnerHTML — there's no HTML
// injection risk since nothing is ever parsed as markup, only as text.
//
// Every span gets the shared `.code` pill (InlineCode.module.css) — the
// one place this styling is defined, so every caller across every module
// and screen renders code the same way instead of each drifting on its own.

import { Fragment } from "react";
import styles from "./InlineCode.module.css";

export function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className={styles.code}>
            {part.slice(1, -1)}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}
