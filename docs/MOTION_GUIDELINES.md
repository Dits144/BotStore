# Motion Guidelines

Motion communicates relationship and feedback; it is not decoration.

## Timing

| Interaction | Duration |
| --- | --- |
| Press/hover/focus | 120–160ms |
| Menu/tooltip | 160–200ms |
| Sidebar | 220–260ms |
| Dialog/sheet | 180–240ms |
| Page content entry | 220–280ms |

Use `cubic-bezier(0.2, 0.8, 0.2, 1)` for entrances and `ease-out` for simple color transitions.

## Patterns

- Sidebar labels fade as the rail width changes; icons do not scale.
- Actionable panels may translate upward by at most 2px and gain the shared shadow.
- Dropdowns and dialogs use a small opacity/translate or opacity/scale transition.
- Buttons change color/border and use a subtle pressed state.
- Row hover is a background-color transition only.
- Loading spinners are permitted only while a request is in flight.

## Reduced motion

When `prefers-reduced-motion: reduce` is active, nonessential animation and smooth scrolling are disabled. State changes remain immediate and comprehensible. No continuous ambient animations are used.
