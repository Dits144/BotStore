# Responsive Guidelines

## Breakpoints

- Mobile: below 640px
- Tablet: 640–1023px
- Desktop: 1024px and above
- Wide desktop: 1280px and above

## Shell

- Desktop uses a 256px sidebar or a persisted 76px collapsed rail.
- Tablet and mobile replace the rail with a modal drawer and backdrop.
- The top bar remains sticky. Page context may truncate, but workspace identity remains available.
- Content uses 16px mobile gutters, 24px tablet gutters, and 32px desktop gutters.

## Layout

- Metrics: one column on small mobile, two columns from 640px, four columns on wide desktop.
- Forms: one column on mobile; related fields may share rows from 768px.
- Panels: stack until each panel can retain a comfortable reading width.
- Page actions wrap beneath the title on mobile and remain full-width only when useful.

## Tables

Tables live inside an explicitly scrollable region with no body-level horizontal overflow. Keep the first identifier and status easy to locate. Controls inside rows remain at least 36px high.

## Mobile interaction

- Minimum primary touch target: 44px.
- Mobile drawer closes after route navigation.
- Dialogs use safe viewport margins and scroll internally when content is tall.
- Hover-only information must also be available by focus or visible text.

## Required visual checks

Validate 1440×900, 1280×800, 768×1024, and 390×844 in light and dark themes. Check drawer navigation, sidebar collapse, group switching, route transitions, dialogs, forms, and table overflow.
