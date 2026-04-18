# PixCarousel
![Node.js](https://img.shields.io/badge/Node.js-Project-green?logo=nodedotjs)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?logo=javascript)](https://github.com/vitaliy-hnatyk/pixcarousel)
[![Node.js CI](https://github.com/vitaliy-hnatyk/pixcarousel/actions/workflows/node.js.yml/badge.svg)](https://github.com/vitaliy-hnatyk/pixcarousel/actions/workflows/node.js.yml)

A responsive slide viewer with swipeable thumbnail rail, lazy loading, keyboard navigation and full touch support. Zero dependencies.

## Install

```bash
npm install pixcarousel
```

## Quick start

```js
import PixCarousel from 'pixcarousel';
import 'pixcarousel/style.css';

const nav = new PixCarousel(document.getElementById('my-slider'), {
  slides: [
    { src: '/img/slide1.jpg', thumbSrc: '/img/thumb1.jpg', alt: 'Virginia map' },
    { src: '/img/slide2.jpg', thumbSrc: '/img/thumb2.jpg', alt: 'Alaska overview' },
    { src: '/img/slide3.jpg', alt: 'Alaska outline' },
  ],
});
```

## HTML markup

Just an empty container — the library renders everything inside it:

```html
<div id="my-slider" style="max-width: 800px;"></div>
```

## Using inline HTML / SVG slides

Pass `html` (for the main slide) and `thumbHtml` (for the thumbnail) instead of `src`:

```js
new PixCarousel(el, {
  slides: [
    {
      html: `<svg viewBox="0 0 760 428">...</svg>`,
      thumbHtml: `<svg viewBox="0 0 110 70">...</svg>`,
      label: 'Virginia map',
    },
  ],
});
```

## Options

| Option          | Type       | Default | Description |
|-----------------|------------|---------|-------------|
| `slides`        | `Slide[]`  | `[]`    | Array of slide descriptors (see below) |
| `initialIndex`  | `number`   | `0`     | Starting slide index |
| `showDots`      | `boolean`  | `true`  | Show dot indicators below the main stage |
| `showCounter`   | `boolean`  | `true`  | Show "1 / N" badge in top-right corner |
| `showArrows`    | `boolean`  | `true`  | Show prev / next arrow buttons |
| `keyboard`      | `boolean`  | `true`  | Enable ← → arrow key navigation |
| `loop`          | `boolean`  | `false` | Loop from last slide back to first |
| `accentColor`   | `string`   | `#E8722A` | Override accent colour (any CSS value) |
| `onChange`      | `function` | `null`  | `(index: number) => void` called on every change |

### Slide descriptor

| Field       | Type     | Description |
|-------------|----------|-------------|
| `src`       | `string` | Image URL — lazy loaded via IntersectionObserver |
| `alt`       | `string` | Alt text for the image |
| `html`      | `string` | Raw HTML / SVG string rendered in the slide |
| `thumbSrc`  | `string` | Thumbnail image URL (falls back to `src`) |
| `thumbHtml` | `string` | Raw HTML / SVG string rendered in the thumbnail |
| `label`     | `string` | Accessible label for aria attributes |

## API

```js
nav.goTo(2);          // jump to slide index 2
nav.next();           // next slide
nav.prev();           // previous slide
nav.currentIndex;     // → number
nav.length;           // → total slides
nav.destroy();        // tear down and remove all listeners
```

## Customisation via CSS variables

Override on the root element or any ancestor:

```css
#my-slider {
  --sn-accent: #0070f3;      /* active dot, thumb border */
  --sn-thumb-w: 130px;       /* thumbnail width */
  --sn-thumb-h: 80px;        /* thumbnail height */
  --sn-transition: 0.3s ease;
}
```

## Usage in React

```jsx
import { useEffect, useRef } from 'react';
import PixCarousel from 'pixcarousel';
import 'pixcarousel/style.css';

export default function MySlider({ slides }) {
  const ref = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    navRef.current = new PixCarousel(ref.current, { slides });
    return () => navRef.current.destroy();
  }, [slides]);

  return <div ref={ref} style={{ maxWidth: 800 }} />;
}
```

## Usage in Vue 3

```vue
<template>
  <div ref="el" style="max-width: 800px" />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import PixCarousel from 'pixcarousel';
import 'pixcarousel/style.css';

const el = ref(null);
let nav;

onMounted(() => {
  nav = new PixCarousel(el.value, {
    slides: [/* ... */],
    loop: true,
  });
});
onUnmounted(() => nav?.destroy());
</script>
```

## Usage via CDN (no bundler)

```html
<link rel="stylesheet" href="https://unpkg.com/pixcarousel/dist/style.css" />
<script src="https://unpkg.com/pixcarousel/dist/pixcarousel.umd.js"></script>
<script>
  const { PixCarousel } = window.PixCarousel;
  new PixCarousel(document.getElementById('slider'), { slides: [...] });
</script>
```

## License

MIT
