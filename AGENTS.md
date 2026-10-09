# Repository Guidance

## Application boundaries

- The DitsStore admin dashboard lives in `whatsapp-group-hub`.
- Preserve root bot behavior, Express API contracts, database schemas, WhatsApp integrations, rental rules, and authorization unless the task explicitly requires backend work.
- `adminAI` is a separate application and should not be modified for DitsStore dashboard tasks.

## Frontend conventions

- Treat `design.md` and the files in `docs/` as the design source of truth.
- Use semantic theme tokens from `src/styles.css`; do not add raw dark-only `bg-white/*` or `border-white/*` styling.
- Support light and dark themes and honor reduced-motion preferences.
- Use Inter, the 4px spacing scale, sentence-case Indonesian copy, and tabular numerals for financial values.
- Reuse Radix/shadcn-style primitives already in `src/components/ui` and Lucide icons. Avoid adding overlapping UI or icon libraries.
- Keep route data fetching and mutations scoped to the active group and preserve existing React Query keys unless a migration is intentional.
- Dashboard menu navigation uses canonical hashes under `/dashboard/` and lazy page modules in `src/pages`. Keep the thin file-route wrappers for legacy URL compatibility.
- Keep page titles compact and descriptions useful. Do not add fake metrics, notifications, or activity.
- New interactive controls must have visible focus, an accessible name, and an adequate touch target.
- Test desktop, tablet, and mobile layouts; ensure tables scroll inside their own container.

## Verification

- Run `npm run build` in `whatsapp-group-hub` after frontend changes.
- Run `npm run lint` when dependencies are available and report pre-existing issues separately.
- For visual changes, inspect representative routes at 1440×900, 768×1024, and 390×844 in both themes when browser tooling is available.
