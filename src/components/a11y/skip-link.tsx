import * as React from "react";

/**
 * Skip-link — first focusable element on every page; lets keyboard and
 * screen-reader users jump straight to the main content. WCAG 2.4.1.
 */
export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a href={`#${targetId}`} className="skip-link">
      Skip to main content
    </a>
  );
}
