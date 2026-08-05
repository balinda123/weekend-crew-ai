# Icons
Icon weight, states, sizing, and direction.

## Match Icon Stroke to Text Weight

| Adjacent text | Icon stroke width (24px grid) |
| --- | --- |
| Regular (400), 14–16px | `1.5px` |
| Medium/Semibold (500–600) | `2px` |
| Bold (700), or emphasized standalone | `2.5px` |

One stroke weight per icon set; never mix libraries on one surface.

## One SVG, Recolored per State
Never ship separate icon assets for states. Use `currentColor`:
```css
.icon-button { color: oklch(0.552 0.016 285.938); }
.icon-button:hover { color: oklch(0.21 0.006 285.885); }
.icon-button[aria-pressed="true"] { color: oklch(0.623 0.188 259.815); }
.icon-button:disabled { opacity: 0.4; }
```

## Outline Default, Fill Active

| Variant | Use for |
| --- | --- |
| Outline | Default state: toolbars, list rows, inline with text |
| Fill | Selected/active state: the active tab, a toggled bookmark |

## Design at Render Size
- Test every icon at the smallest size it will render (often `16px`)
- Keep icons on the pixel grid at their render size
- Always SVG, never raster

## Icons in RTL
Flip icons whose meaning is tied to reading direction (back/forward arrows, chevrons). Leave physical objects and media playback icons alone.
```css
[dir="rtl"] .icon-directional {
  scale: -1 1;
}
```
