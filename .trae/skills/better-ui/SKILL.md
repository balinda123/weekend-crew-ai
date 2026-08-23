---
name: better-ui
description: Design engineering principles for making interfaces feel polished. Use when building UI components, reviewing frontend code, implementing animations, hover states, shadows, borders, micro-interactions, enter/exit animations, or any visual detail work.
---

# better-ui

Design engineering principles for making interfaces feel polished.

## Quick Reference

| Category | When to Use |
| --- | --- |
| [Surfaces](./surfaces.md) | Border radius, optical alignment, shadows, image outlines |
| [Animations](./animations.md) | Interruptible animations, enter/exit transitions, icon animations, scale on press, motion restraint |
| [Icons](./icons.md) | Icon stroke weight, states via currentColor, outline vs fill, sizing, RTL flipping |
| [Performance](./performance.md) | Transition specificity, will-change usage |

## Core Principles

### 1. Concentric Border Radius
Outer radius = inner radius + padding. Mismatched radii on nested elements is the most common thing that makes interfaces feel off.

### 2. Optical Over Geometric Alignment
When geometric centering looks off, align optically. Buttons with icons, play triangles, and asymmetric icons all need manual adjustment.

### 3. Shadows for Elevation, Borders for Structure
For buttons, cards, and containers whose border exists only to create depth, prefer layered transparent `box-shadow` values. Keep borders that communicate structure or state: dividers, layout separators, and selected or focus states.

### 4. Interruptible Animations
Use CSS transitions for interactive state changes: they can be interrupted mid-animation. Reserve keyframes for staged sequences that run once.

### 5. Split and Stagger Enter Animations
For an infrequent staged entrance where sequence helps communicate hierarchy, break content into semantic chunks and stagger them by ~100ms instead of animating one container. Do not stagger routine, high-frequency interactions.

### 6. Subtle Exit Animations
Use a small fixed `translateY` instead of full height. Exits should be softer than enters. Use `ease-out` for both enter and exit transitions.

### 7. Contextual Icon Animations
Animate icons with `opacity`, `scale`, and `blur` instead of toggling visibility. Use exactly these values: scale from `0.25` to `1`, opacity from `0` to `1`, blur from `4px` to `0px`.

### 8. Image Outlines
Add a subtle `1px` outline with low opacity to images for consistent depth. Pure black in light mode, pure white in dark mode, never tinted neutrals.

### 9. Scale on Press
A subtle `scale(0.96)` on click gives buttons tactile feedback. Always use `0.96`. Never use a value smaller than `0.95`.

### 10. Skip Animation on Page Load
Use `initial={false}` on `AnimatePresence` to prevent enter animations on first render.

### 11. Never Use `transition: all`
Always specify exact properties: `transition-property: scale, opacity`.

### 12. Use `will-change` Sparingly
Only for `transform`, `opacity`, `filter`. Never use `will-change: all`. Only add when you notice first-frame stutter.

### 13. Match Icon Stroke to Text Weight
`1.5px` stroke beside regular (400) text, `2px` beside semibold (600). One stroke weight per icon set.

### 14. One SVG, Recolored per State
Icons use `currentColor` and get their states from CSS color and opacity, never from separate assets.

### 15. Motion Restraint
No custom animation on high-frequency interactions. Motion is never the only feedback channel; every animated state change also needs a static cue.

## Common Mistakes

| Mistake | Fix |
| --- | --- |
| Same border radius on closely nested parent and child | Calculate outerRadius = innerRadius + padding |
| Icons look off-center | Adjust optically with padding or fix SVG directly |
| Border used only to fake elevation | Use layered box-shadow with transparency |
| Jarring staged entrance or contextual exit | Stagger infrequent entrances and keep exits subtle |
| transition: all on elements | Specify exact properties |
| Hairline icon beside bold text | Match the stroke width to the text weight |
| Separate icon assets per state | One currentColor SVG, states via CSS |
| Filled icons everywhere | Outline as default, fill only for the active state |
| Entrance animation on every hover or keystroke | Instant feedback or ≤150ms opacity/color transition |
