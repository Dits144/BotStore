# DitsStore Design System

## Foundations

The system uses Inter and a 4px spacing grid. Financial values, counts, and identifiers use tabular numerals; only technical identifiers use monospace.

### Type scale

| Role | Size / line height | Weight |
| --- | --- | --- |
| Page title | 28 / 36px | 650–700 |
| Section title | 16 / 24px | 600 |
| Panel title | 14 / 20px | 600 |
| Body | 14 / 22px | 400 |
| Supporting | 12 / 18px | 400–500 |

### Spacing

Use multiples of 4px. Default control gaps are 8px, panel internal gaps are 16–20px, section gaps are 24px, and page region gaps are 28–32px.

### Radius

- 8px: tags and small controls
- 10px: inputs and buttons
- 12px: compact panels and table containers
- 16px: primary panels and dialogs
- Full: avatars, status dots, and pills only

## Semantic color tokens

Do not use raw white overlays for component styling. Use semantic tokens.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| background | `#F7F8FA` | `#0E1117` | Application canvas |
| foreground | `#17212B` | `#F3F5F7` | Primary text |
| card | `#FFFFFF` | `#171C24` | Raised surface |
| secondary | `#F1F3F6` | `#1D2430` | Subtle controls |
| muted foreground | `#667085` | `#98A2B3` | Supporting text |
| primary | `#0F7A5B` | `#42C99A` | Primary action and active state |
| accent | `#E9F1FB` | `#202C3B` | Informational selection |
| border | `#E3E7ED` | `#2A323E` | Structural division |
| destructive | `#D14343` | `#FF7474` | Destructive actions |
| warning | `#B7791F` | `#F4C15D` | Attention |
| info | `#3577C7` | `#73AEEF` | Informational state |

All text/surface combinations target WCAG AA. Color is never the only indicator of state.

## Elevation

Use borders for most separation. One soft shadow token is available for dropdowns, dialogs, the sticky top bar, and hovered actionable panels. Avoid glow and inner highlight effects.

## Icons

Use Lucide at 16px in controls, 18–20px in navigation, and 20px in metric tiles. Decorative icons are not permitted. Each icon must reinforce a label or have an accessible name and tooltip.

## Data formatting

- Currency uses Indonesian locale and `Rp` formatting.
- Dates show local, human-readable Jakarta context when supplied by existing helpers.
- Empty values use an em dash.
- Status labels use Indonesian sentence case.
