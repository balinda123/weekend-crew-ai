# Animations
Interruptible animations, enter/exit transitions, contextual icon animations, and motion restraint.

## Interruptible Animations
Always prefer CSS transitions for interactive elements. Reserve keyframes for one-shot sequences.

```css
/* Good: interruptible transition */
.drawer {
  transform: translateX(-100%);
  transition: transform 200ms ease-out;
}
.drawer.open {
  transform: translateX(0);
}
```

## Enter Animations: Split and Stagger
For infrequent staged entrances. Break content into semantic chunks, stagger ~100ms.

### CSS-Only Stagger
```css
.stagger-item {
  opacity: 0;
  transform: translateY(12px);
  filter: blur(4px);
  animation: fadeInUp 400ms ease-out forwards;
}
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 100ms; }
.stagger-item:nth-child(3) { animation-delay: 200ms; }
@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
```

## Exit Animations
Exit animations should be softer and less attention-grabbing than enter animations.

```css
/* Good: subtle exit */
.item-exit {
  opacity: 0;
  transform: translateY(-12px);
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
```

Key points:
- Use a small fixed `translateY` (e.g., `-12px`)
- Exit duration shorter than enter (150ms vs 300ms)
- Use `ease-out` for both

## Contextual Icon Animations
Animate icons with `opacity`, `scale`, and `blur`:
- `scale`: `0.25` → `1`
- `opacity`: `0` → `1`
- `filter`: `"blur(4px)"` → `"blur(0px)"`

### CSS cross-fade (no motion library)
Keep both icons in DOM, one absolutely positioned, cross-fade with CSS:
```css
.icon-active {
  transition-property: opacity, filter, scale;
  transition-duration: 300ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
```

## Scale on Press
Always use `scale(0.96)`. Never smaller than `0.95`.

```css
.button {
  transition-property: scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.button:active {
  scale: 0.96;
}
```

## Skip Animation on Page Load
Prevent enter animations from firing on first render. Only animate on subsequent state changes.

## Motion Restraint
- No custom animation on high-frequency interactions
- Motion is never the only feedback channel
- Brief and precise beats prominent
- High-frequency hover gets minimal transition: `opacity`/`background-color` at ≤150ms
