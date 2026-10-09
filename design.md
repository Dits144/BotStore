# DitsStore Product Design Specification

## Product intent

DitsStore is an operational workspace for people who run one or more WhatsApp bot stores. The interface should help an administrator answer three questions quickly: which group am I managing, what needs attention, and what can I do next?

The visual direction is **warm operational minimalism**: light neutral canvas, precise surfaces, a restrained emerald action color, muted blue for informational context, and charcoal typography. Dark mode uses layered navy-charcoal surfaces rather than pure black.

## Experience principles

1. Group context is always visible. Any action that affects a group sits beneath a clear workspace selector.
2. Data comes before decoration. Metrics, status, and primary tasks occupy the strongest positions.
3. One surface, one purpose. Panels group related controls instead of turning every line into a card.
4. Calm feedback. Motion confirms interaction and state changes without competing with the content.
5. Indonesian first. Copy is short, natural, and consistent; technical identifiers remain unchanged.
6. Existing business behavior is preserved. Presentation code does not reinterpret backend rules.

## Signature visual language

- A compact rail-like sidebar with a soft emerald active marker.
- A slim top bar with page context, workspace selection, theme, and account controls.
- White or charcoal panels with quiet borders and one low elevation level.
- Metrics use typography and a small tinted icon tile rather than gradients.
- Section labels use sentence case with normal tracking.
- Status is communicated through text, icon, and color together.
- Empty states are compact and task-oriented.

## Information architecture

Navigation is grouped into `Ringkasan`, `Operasional`, and `Sistem`. Overview is independent; catalogue, stock, transactions, payment, and group tools form the operational group; owner controls and settings form the system group. Owner-only entries remain role-gated.

Dashboard navigation uses a single application shell with canonical hash URLs such as `/dashboard/#price-list`, `/dashboard/#stock`, and `/dashboard/#transactions`. Page modules are lazy-loaded inside the shell, so changing sections does not reload the document. The original nested route URLs remain available for backward compatibility.

## Theme behavior

The initial theme follows `prefers-color-scheme`. A compact switch persists an explicit `light`, `dark`, or effective user choice in local storage. Theme application occurs before meaningful paint where possible, and all colors flow through semantic CSS variables.

## Content density

The content frame uses a maximum width of 1440px and responsive 20–32px gutters. Page headers are compact. Operational panels default to 20–24px padding on desktop and 16px on mobile. Tables use 44–52px rows and preserve horizontal scrolling as a fallback.

## Page direction

- **Overview:** concise page heading, four real product metrics, compact action strip, catalogue preview, and actionable stock context.
- **Daftar Harga:** search and create controls aligned with a readable product table; edit dialogs retain current fields.
- **Kelola Stok:** summary and search stay close to inventory rows; state toggles communicate current value without relying on color alone.
- **Transaksi:** real revenue metrics, existing chart and top products, followed by filterable transaction history.
- **Pembayaran:** payment identity and caption are separate, clearly labeled settings panels with safe preview behavior.
- **Alat Grup:** tabbed operational workspace; high-impact group state actions are visually separated from content tools.
- **Sewa & Pemilik:** expiration and active state lead each row; renewal, diagnostics, tenant, and owner controls remain explicit.
- **Pengaturan:** logical sections, visible save boundaries, and a clearly isolated danger zone.

## Non-goals

No fake notifications, activity records, analytics, subscription concepts, or inferred bot status are added. Backend endpoints, authorization, schemas, and rental rules remain unchanged.
