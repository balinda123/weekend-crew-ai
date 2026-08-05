# Surfaces
Border radius, optical alignment, shadows, and image outlines.

## Concentric Border Radius
When nesting rounded elements, the outer radius must equal the inner radius plus the padding between them:
```
outerRadius = innerRadius + padding
```
This rule is most useful when nested surfaces are close together. If padding is larger than `24px`, treat the layers as separate surfaces and choose each radius independently.

### Example
```css
/* Good: concentric radii */
.card {
  border-radius: 20px; /* 12 + 8 */
  padding: 8px;
}
.card-inner {
  border-radius: 12px;
}
/* Bad: same radius on both */
.card {
  border-radius: 12px;
  padding: 8px;
}
.card-inner {
  border-radius: 12px;
}
```

## Optical Alignment
When geometric centering looks off, align optically instead.

### Buttons with Text + Icon
`icon-side padding = text-side padding - 2px`.
```css
.button-with-icon {
  padding-inline-start: 16px;
  padding-inline-end: 14px; /* trailing icon side = text side - 2px */
}
```

### Play Button Triangles
Shift slightly right:
```css
.play-button svg {
  transform: translateX(2px);
}
```

## Shadows Instead of Borders
For buttons, cards, and containers that use a border for depth, prefer `box-shadow`. Shadows adapt to any background since they use transparency.

**Do not apply to dividers** or any border whose purpose is layout separation.

### Shadow as Border (Light Mode)
```css
:root {
  --shadow-border:
    0px 0px 0px 1px oklch(0 0 0 / 0.06),
    0px 1px 2px -1px oklch(0 0 0 / 0.06),
    0px 2px 4px 0px oklch(0 0 0 / 0.04);
  --shadow-border-hover:
    0px 0px 0px 1px oklch(0 0 0 / 0.08),
    0px 1px 2px -1px oklch(0 0 0 / 0.08),
    0px 2px 4px 0px oklch(0 0 0 / 0.06);
}
```

### Shadow as Border (Dark Mode)
```css
--shadow-border: 0 0 0 1px oklch(1 0 0 / 0.08);
--shadow-border-hover: 0 0 0 1px oklch(1 0 0 / 0.13);
```

### Usage with Hover Transition
```css
.card {
  box-shadow: var(--shadow-border);
  transition-property: box-shadow;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.card:hover {
  box-shadow: var(--shadow-border-hover);
}
```

## Image Outlines
Add a subtle `1px` outline with low opacity to images.

### Color rules (non-negotiable)
- **Light mode**: pure black, `oklch(0 0 0 / 0.1)`.
- **Dark mode**: pure white, `oklch(1 0 0 / 0.1)`.
- Never use tinted neutrals (slate, zinc, etc.).
- Never match the outline to the project's accent or ink color.

```css
img {
  outline: 1px solid oklch(0 0 0 / 0.1);
  outline-offset: -1px;
}
```
