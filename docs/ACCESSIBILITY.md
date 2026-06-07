# Accessibility statement

Adapted Books is committed to providing an inclusive experience that meets
**WCAG 2.1 AA**, and is on a path toward AAA where it does not compromise
usability.

## Conformance

| Criterion | Status |
| --- | --- |
| 1.1 Non-text content | All pictograms have alt text; ARASAAC labels fall back to a generated description. |
| 1.2 Time-based media | N/A (no audio/video yet). |
| 1.3 Adaptable | Semantic HTML, ARIA only where necessary, layout survives 200 % zoom and 320 px width. |
| 1.4 Distinguishable | Contrast tokens (`.hc` for AAA), text-size scaling (`data-text-size`), no color-only signals. |
| 2.1 Keyboard | All interactive elements reachable; visible focus ring (`:focus-visible`); skip-to-content link. |
| 2.2 Enough time | Session timeout warning with 30 s extension. |
| 2.3 Seizures | No flashing content above 3 Hz. |
| 2.4 Navigable | Page titles, breadcrumbs, descriptive links, focus order matches DOM order. |
| 2.5 Input modalities | Targets ≥ 44 × 44 CSS px; pointer cancellation supported. |
| 3.1 Readable | `lang` on root, plain-language prompts, dyslexia-friendly font option (Atkinson Hyperlegible). |
| 3.2 Predictable | No unexpected context changes on focus. |
| 3.3 Input assistance | Form errors are announced; required fields are programmatically marked. |
| 4.1 Compatible | Names, roles, states; live regions for toasts. |

## Assistive tech supported

- NVDA + Firefox (latest)
- VoiceOver + Safari (latest)
- JAWS + Chrome (latest)
- Switch control (iOS / Android)
- Dragon NaturallySpeaking (latest)
- Standard OS high-contrast and reduced-motion settings

## Known limitations

- The visual editor requires a fine pointer for drag operations; a
  keyboard-driven alternative is on the roadmap.
- Real-time AI generation is rate-limited; offline-first PWA mode falls back
  to a deterministic mock with reduced quality.

## Feedback

If you encounter a barrier, please email **a11y@adaptedbooks.app** or open an
issue with the `a11y` label. We aim to respond within 5 business days.
