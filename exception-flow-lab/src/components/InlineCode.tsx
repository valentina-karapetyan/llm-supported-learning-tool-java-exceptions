// src/components/InlineCode.tsx
//
// Authored content sometimes uses markdown-style `code` spans, e.g.
// "`first()` starts". This renders those as real React elements (a plain
// split + map), not via dangerouslySetInnerHTML — there's no HTML
// injection risk since nothing is ever parsed as markup, only as text.

import { Fragment } from "react";

export function InlineCode({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? <code key={i}>{part.slice(1, -1)}</code> : <Fragment key={i}>{part}</Fragment>
      )}
    </>
  );
}
