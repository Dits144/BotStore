# Component Guidelines

## Page header

Every dashboard route starts with one title, one concise description, and optional right-aligned contextual actions. Do not include decorative eyebrows unless they communicate live group context.

Primary dashboard navigation targets `/dashboard/` plus the page hash. Use TanStack Router links with `hashScrollIntoView={false}` so section changes remain client-side and do not jump to arbitrary elements.

## Panels

Use `.surface-panel` or the shared panel component for a coherent content region. Panels use a semantic card background, 1px border, 12–16px radius, and no backdrop blur. Nested content should use separators or a soft secondary surface rather than another full card.

## Metrics

Metric cards contain a label, a real value, a brief derived hint, and one icon. They use tabular numerals. Do not animate values or add trend claims unless the API provides historical comparison.

## Buttons and inputs

- Primary buttons are reserved for the main action in a region.
- Destructive actions require clear wording and existing confirmation behavior.
- Controls are at least 40px high; icon-only touch targets are at least 40px square.
- Focus uses the semantic ring and remains visible in both themes.
- Loading controls preserve width and include a spinner plus text when space allows.

## Tables and responsive data

Use a bordered table region with a subtle header background and hover state. Keep the primary identifier in the first column and actions last. On narrow screens, allow horizontal scrolling and keep tap targets generous; do not hide critical status or identifying information.

## Status

Status indicators combine a label with color and, where useful, an icon. Use `success`, `warning`, `destructive`, `info`, or neutral semantics; do not invent new colors per page.

## Empty, loading, and error states

An empty state explains what is missing and offers an existing next action. A loading state uses skeleton geometry close to final content. Errors use actionable Indonesian copy and never expose credentials or raw payloads.

## Dialogs and menus

Dialogs use a 16px radius, clear title, supporting description, and predictable footer order. Menus use semantic popover tokens. Radix focus management and keyboard behavior must be preserved.

## Copy

Prefer short Indonesian labels: `Ringkasan`, `Simpan perubahan`, `Hubungkan grup`, `Belum ada transaksi`. Keep JID, QRIS, and established bot-command terminology when translation would reduce clarity.
