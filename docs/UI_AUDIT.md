# DitsStore Admin UI Audit

## Scope and architecture

The repository contains three applications:

- The root Node.js/Baileys service owns WhatsApp connectivity, commands, rentals, catalogues, transactions, SQLite access, and the Express API.
- `whatsapp-group-hub` is the production admin dashboard covered by this redesign. It uses React 19, TanStack Start/Router, React Query, Tailwind CSS 4, Radix UI primitives, Lucide icons, Sonner, and Recharts.
- `adminAI` is a separate Next.js application and is outside the DitsStore dashboard scope.

The dashboard authenticates against the Express API, persists the JWT session and active group in local storage, and scopes catalogue, stock, transaction, payment, and group-tool requests to the selected group. Owner-only navigation protects the rental and owner interface in the client; server endpoints remain the authority for authorization.

## Existing routes and functionality

| Route | Existing capability | Data source |
| --- | --- | --- |
| `/dashboard` | Product overview, stock metrics, quick links, recent products | Products API |
| `/dashboard/price-list` | Search, create, edit, and delete catalogue items | Products API |
| `/dashboard/stock` | Search and toggle stock, fast delivery, and rarity | Products API |
| `/dashboard/transactions` | Revenue metrics, chart, top products, history, status updates | Transaction APIs |
| `/dashboard/payment` | QRIS preview/upload and payment caption | Payment APIs |
| `/dashboard/group-tools` | Group open/close, broadcast, clone catalogue, welcome settings, members, customer leaderboard | Group APIs |
| `/dashboard/rentals` | Owner-only rental, owner, diagnostics, expiry, and renewal controls | Rental/owner APIs |
| `/dashboard/settings` | Linked groups, welcome, QRIS, caption, rental report, destructive transaction cleanup | Auth and settings APIs |

Login, registration, link-token handling, multi-group switching, and role-specific navigation are working flows that must be preserved.

## Current design problems

- The interface is dark-only and forces `color-scheme: dark`, despite the product needing a system-aware light theme.
- Glassmorphism, glow, gradients, and translucent white fills are used on nearly every surface, weakening hierarchy and making the interface feel visually repetitive.
- Cards, headers, dialogs, and controls frequently use the same large radius and treatment regardless of importance.
- The sidebar is fixed-width, cannot collapse on desktop, and lacks durable user preference.
- The top bar does not communicate page context and gives the group selector and account control similar visual weight.
- Page headers vary in size, vocabulary, casing, spacing, and language. Several pages mix Indonesian and English.
- Dense pages rely on wide tables with limited small-screen adaptations. Horizontal scrolling is available in places but important identifying data can disappear off-screen.
- Empty, loading, and error treatments are inconsistent. Several states are plain text while others are decorative cards.
- Frequent uppercase labels and wide letter spacing make longer Indonesian copy harder to scan.
- The dashboard overview emphasizes decoration and greeting copy before operational information.
- Repeated entry animations run at the page/card level and do not consistently respect reduced-motion preferences.

## Components to reuse

- Radix-based Dialog, DropdownMenu, Select, Tabs, Tooltip, Sheet, Switch, and AlertDialog primitives provide accessible behavior.
- `Button`, `Input`, `Textarea`, `Table`, and `Badge` remain useful once their visual tokens and focus treatment are updated.
- `AuthProvider` already provides the correct group switching and session behavior.
- React Query keys are correctly scoped to the active group on core routes.
- Existing route-level mutations, validation, confirmation dialogs, and toasts should be preserved.
- Lucide is already installed and should remain the only icon family.

## Components requiring redesign

- `DashboardLayout`: responsive shell, desktop collapse, mobile drawer, page context, workspace selector, theme control, and account presentation.
- Overview metric cards and quick actions: reduce decorative effects and establish clearer information density.
- Page header, panel, metric, status, empty-state, and skeleton patterns: standardize in shared components.
- Base button/input/dialog/table styles: align radii, focus rings, borders, elevations, and motion.
- Authentication screens: remove ambient orbs and oversized marketing treatment in favor of a calm branded split layout.

## Spacing and typography findings

- Page content widths range between `max-w-5xl` and `max-w-7xl` without a documented reason.
- Panel padding varies from 2 to 10 spacing units; compact controls and large content regions are not differentiated systematically.
- Headings range from 20px to 40px for equivalent page-level roles.
- Table labels, tabs, and section titles overuse 10–12px uppercase text.
- Financial values generally use tabular numerals, but this is not established as a shared rule.

## Responsive and accessibility findings

- The existing mobile sidebar and backdrop are functional, but focus containment and a visible close target need stronger treatment.
- The group selector can become too wide in the compact top bar.
- Several icon-only controls lack visible tooltip affordances on desktop.
- Some foreground colors are encoded as dark-theme-only utilities (`border-white/*`, `bg-white/*`), producing poor light-theme results.
- Small 7–8px status dots and 10px labels are not sufficient as the only status communication.
- Fixed table minimum widths are acceptable as a fallback, but mobile summaries need prioritized columns and clearer scroll cues.
- Focus styles are inconsistent and several custom buttons use only hover feedback.
- Motion needs a global `prefers-reduced-motion` override.

## Motion opportunities

- Animate sidebar width and label disclosure without moving the content vertically.
- Use short opacity/translate transitions for page entry, dropdowns, and dialogs.
- Use border and shadow transitions for panels; avoid scale changes on large cards.
- Preserve loading spinners for active operations and use skeletons for query loading.
- Avoid number count-up because values refresh from real group data and animated interpolation could misrepresent them.

## Functional risks during refactoring

- The `linkToken` query flow automatically links owner accounts and opens the password dialog for admins; this effect sequence must remain intact.
- Group selection is persisted separately from the session and must remain synchronized with React Query keys.
- Owner-only rental navigation must not become visible to admin users.
- Product update responses are merged client-side because the backend returns only `{ success: true }`.
- QRIS upload and broadcast image payloads use base64 and must not be duplicated or logged.
- Rental dates use backend values and Jakarta business rules; the frontend must not reinterpret expiry logic.
- No API contract, database schema, bot command, or backend business rule is changed by the redesign.

## Baseline verification

The working tree was clean before implementation. The initial build could not start because frontend dependencies were not installed (`vite` was unavailable). Dependency installation and build verification are therefore required after the presentation changes.
