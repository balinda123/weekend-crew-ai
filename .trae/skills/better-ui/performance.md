# Performance
Transition specificity and GPU compositing hints.

## Transition Only What Changes
Never use `transition: all`. Always specify the exact properties that change.

```css
/* Good */
.button {
  transition-property: scale, background-color;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
/* Bad */
.button {
  transition: all 150ms ease-out;
}
```

### Why
- `transition: all` forces the browser to watch every property
- Causes unexpected transitions on properties you didn't intend to animate
- Prevents browser optimizations

## Use `will-change` Sparingly
Only for GPU-compositable properties: `transform`, `opacity`, `filter`.

```css
/* Good */
.animated-card {
  will-change: transform;
}
/* Bad */
.animated-card {
  will-change: all;
}
```

### When to Skip
Only add `will-change` when you notice first-frame stutter. Don't add it preemptively to every animated element; each extra compositing layer costs memory.

| Property | GPU-compositable | Worth `will-change` |
| --- | --- | --- |
| `transform` | Yes | Yes |
| `opacity` | Yes | Yes |
| `filter` | Yes | Yes |
| `top`, `left`, `width`, `height` | No | No |
| `background`, `border`, `color` | No | No |
