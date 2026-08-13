# MOSCATELLI ATLAS — DESIGN SYSTEM

## Current direction
Atlas is a bright, highly modern institutional archive. After Patch 02, the interface direction is deliberately cleaner and more sans-led than the initial foundation specimen.

The Home experience takes loose inspiration from the compositional clarity of contemporary light Gemini interfaces: generous empty space, one dominant invitation and an exceptionally clear input surface. Atlas must not copy Gemini branding, its colour identity or its product-specific controls.

## Home composition
- The Home page is search-first.
- Primary question: **What are you looking for?**
- The search field is the principal visual control.
- Do not fill Home with category cards.
- Manual research lives inside the separate Browse menu.
- Future secondary information must use progressive disclosure so the default state remains calm.

## Core colour tokens
See `assets/css/tokens.css` for canonical values.

Material roles:
- Canvas: warm near-white environment.
- Paper: content and menu surfaces.
- Ink: primary interface text.
- Bronze: restrained MOSCATELLI active/accent state.
- Burgundy: reserved institutional emphasis.

Generic SaaS blue remains explicitly avoided.

## Typography
- Interface titles, navigation and controls: modern sans-first stack.
- Long-form reading: editorial serif remains available and will become prominent in the article reader.
- MOSCATELLI wordmark: restrained serif accent is retained.
- Metadata/system references: monospaced stack when useful.
- No remote font dependency is required.

## Geometry
- The central search field may use a soft pill geometry because it is a singular interaction surface.
- Browse drawer remains structurally square.
- Avoid spreading rounded cards throughout the product.
- Prefer whitespace, thin rules and typographic hierarchy.

## Motion foundation
Tokens:
- Micro: 140ms.
- Standard: 240ms.
- Route: 380ms.
- Editorial reveal: 600ms.

Motion communicates state and continuity, uses transform/opacity where practical and respects `prefers-reduced-motion`.

## Search surface
- High-contrast readable input.
- Strong but restrained focus-within state.
- Touch target above 44px.
- No layout jump while typing.
- Empty submission produces a textual instruction rather than a silent failure.

## Reading measure
Target long-form measure remains approximately 70 characters (`--reading-measure: 70ch`).

## Patch 03 — Home search disclosure
- The Home remains question + search at rest; suggestion surfaces are progressive disclosure only.
- Search suggestions use the same warm white surface language as the central search pill, with lower visual weight than the Browse menu.
- Sample suggestions are query starters based on demonstration-content titles from the product brief, never presented as live search results.
- Keyboard active state and pointer hover share the same quiet warm tint.
- The Home `/` shortcut is behavioural only; it does not add permanent interface furniture.

## Patch 06 Search language
Search extends the light modern direction introduced after Patch 01:
- Search surfaces use generous blank space and a strong sans-serif hierarchy.
- Primary search inputs are softly elevated rounded fields; result content itself is not cardified.
- Results are separated by fine rules and typography rather than boxed tiles.
- Match highlighting uses a low-saturation warm tint so it remains legible without resembling a warning state.
- The global command Search is centred on desktop and becomes a full-height native dialog on narrow mobile screens.
- Search motion is short, opacity/transform based and entirely suppressed by the global reduced-motion rules.
- Home remains visually unchanged at rest; Search power appears only after interaction.


## Playbook pattern (Patch 07)
Playbooks intentionally differ from article readers. The scenario is quiet context; the immediate-action sequence receives the strongest hierarchy. Escalation uses a restrained burgundy-tinted field rather than alarm red. The page avoids a dashboard/card-wall treatment and keeps operational guidance in continuous editorial flow.


## Motion system — Patch 10

### Principles
- Motion communicates hierarchy, continuity or state; it is not decorative spectacle.
- Native scrolling remains untouched.
- Geometry/layout properties are not animated when transforms can communicate the same change.
- Reading content is always available even if motion JavaScript fails.

### Timing
- Micro: `--duration-micro` (140ms)
- Standard: `--duration-standard` (240ms)
- Fast route/overlay: `--duration-route-fast` (280ms)
- Route: `--duration-route` (420ms)
- Editorial composition: `--duration-editorial` (680ms)

### Easing
`--ease-standard` handles state changes; `--ease-out` handles directional micro-motion; `--ease-route` is the primary spatial route curve; `--ease-emphasis` is reserved for composed entrances.

### Patterns
1. **Route:** same-document View Transition when available; CSS opacity/translate fallback otherwise.
2. **Shared continuity:** result/list title may transition into the destination page title.
3. **Overlay:** Browse and Search enter/leave with short opacity/transform patterns.
4. **Editorial reveal:** only below-the-fold list/section content is progressively revealed with IntersectionObserver.
5. **Progress:** article/course bars use `transform: scaleX()` rather than animated width.
6. **State:** completion/bookmark/acknowledgement controls receive a restrained WAAPI scale confirmation.
7. **Reduced motion:** transition orchestration is bypassed; reveals are immediately visible; global accessibility rules collapse animation/transition duration.
