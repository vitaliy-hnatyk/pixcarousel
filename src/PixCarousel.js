import './style.css';

/**
 * @typedef {Object} Slide
 * @property {string} [src]         - Image URL (lazy loaded)
 * @property {string} [alt]         - Alt text for img
 * @property {string} [html]        - Raw HTML / SVG string for slide content
 * @property {string} [thumbSrc]    - Thumbnail image URL (falls back to src)
 * @property {string} [thumbHtml]   - Raw HTML / SVG string for thumbnail
 * @property {string} [label]       - Accessible label
 */

/**
 * @typedef {Object} PixCarouselOptions
 * @property {Slide[]}  slides              - Array of slide descriptors
 * @property {number}   [initialIndex=0]    - Starting slide index
 * @property {boolean}  [showDots=true]     - Show dot indicators
 * @property {boolean}  [showCounter=true]  - Show "1 / N" counter badge
 * @property {boolean}  [showArrows=true]   - Show prev/next arrow buttons
 * @property {boolean}  [keyboard=true]     - Enable arrow-key navigation
 * @property {boolean}  [loop=false]        - Loop at start/end
 * @property {string}   [accentColor]       - Override accent colour (CSS value)
 * @property {Function} [onChange]          - Callback(index) on slide change
 */

export class PixCarousel {
  /**
   * @param {HTMLElement} container
   * @param {PixCarouselOptions} options
   */
  constructor(container, options = {}) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('[PixCarousel] container must be an HTMLElement');
    }

    this._container = container;
    this._opts = Object.assign({
      slides: [],
      initialIndex: 0,
      showDots: true,
      showCounter: true,
      showArrows: true,
      keyboard: true,
      loop: false,
      accentColor: null,
      onChange: null,
    }, options);

    this._current = this._opts.initialIndex;
    this._total = this._opts.slides.length;
    this._dragging = false;
    this._startX = 0;
    this._startY = 0;
    this._deltaX = 0;
    this._io = null; // IntersectionObserver for lazy load

    this._build();
    this._bindEvents();
    this._goTo(this._current, false);
  }

  /* ─────────────────────────── DOM BUILD ─────────────────────────── */

  _build() {
    const c = this._container;
    c.classList.add('sn-root');
    if (this._opts.accentColor) {
      c.style.setProperty('--sn-accent', this._opts.accentColor);
    }

    // ── Stage
    this._stage = this._el('div', 'sn-stage', { role: 'region', 'aria-label': 'Slide viewer' });
    this._track = this._el('div', 'sn-track');

    this._opts.slides.forEach((slide, i) => {
      const s = this._buildSlide(slide, i);
      this._track.appendChild(s);
    });

    this._stage.appendChild(this._track);

    // Arrows
    if (this._opts.showArrows) {
      this._prevBtn = this._buildBtn('‹', 'sn-btn--prev', 'Previous slide');
      this._nextBtn = this._buildBtn('›', 'sn-btn--next', 'Next slide');
      this._prevBtn.addEventListener('click', () => this.prev());
      this._nextBtn.addEventListener('click', () => this.next());
      this._stage.appendChild(this._prevBtn);
      this._stage.appendChild(this._nextBtn);
    }

    // Dots
    if (this._opts.showDots && this._total > 1) {
      this._dotsEl = this._el('div', 'sn-dots', { role: 'tablist', 'aria-label': 'Slide position' });
      for (let i = 0; i < this._total; i++) {
        const dot = this._el('button', 'sn-dot', { role: 'tab', 'aria-label': `Slide ${i + 1}` });
        dot.addEventListener('click', () => this.goTo(i));
        this._dotsEl.appendChild(dot);
      }
      this._stage.appendChild(this._dotsEl);
    }

    // Counter
    if (this._opts.showCounter) {
      this._counterEl = this._el('div', 'sn-counter', { 'aria-live': 'polite' });
      this._stage.appendChild(this._counterEl);
    }

    c.appendChild(this._stage);

    // ── Thumbnail rail
    const railWrap = this._el('div', 'sn-rail-wrap');
    this._rail = this._el('div', 'sn-rail', { role: 'listbox', 'aria-label': 'Slide thumbnails' });

    this._opts.slides.forEach((slide, i) => {
      const th = this._buildThumb(slide, i);
      this._rail.appendChild(th);
    });

    railWrap.appendChild(this._rail);
    c.appendChild(railWrap);

    // ── Lazy load via IntersectionObserver
    if ('IntersectionObserver' in window) {
      this._io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const src = el.dataset.src;
            if (src) {
              el.src = src;
              el.addEventListener('load', () => el.classList.add('sn-loaded'), { once: true });
              el.addEventListener('error', () => el.classList.add('sn-loaded'), { once: true });
              delete el.dataset.src;
              this._io.unobserve(el);
            }
          }
        });
      }, { rootMargin: '200px' });

      c.querySelectorAll('[data-src]').forEach(el => this._io.observe(el));
    } else {
      // Fallback: load all immediately
      c.querySelectorAll('[data-src]').forEach(el => {
        el.src = el.dataset.src;
        el.classList.add('sn-loaded');
      });
    }

    // ── Thumbnail rail drag (mouse)
    let railDrag = false;
    this._rail.addEventListener('mousedown', () => { railDrag = true; });
    this._rail.addEventListener('mousemove', e => { if (railDrag) this._rail.scrollLeft -= e.movementX; });
    this._rail.addEventListener('mouseup', () => { railDrag = false; });
    this._rail.addEventListener('mouseleave', () => { railDrag = false; });
  }

  _buildSlide(slide, i) {
    const s = this._el('div', 'sn-slide', {
      role: 'tabpanel',
      'aria-label': slide.label || `Slide ${i + 1}`,
      'aria-hidden': i === this._current ? 'false' : 'true',
    });

    if (slide.html) {
      const ph = this._el('div', 'sn-slide-placeholder');
      ph.innerHTML = slide.html;
      s.appendChild(ph);
    } else if (slide.src) {
      const img = this._el('img', 'sn-slide-img', {
        alt: slide.alt || `Slide ${i + 1}`,
        'data-src': slide.src,
      });
      s.appendChild(img);
    }

    return s;
  }

  _buildThumb(slide, i) {
    const th = this._el('div', 'sn-thumb', {
      role: 'option',
      tabindex: '0',
      'aria-label': slide.label || `Slide ${i + 1}`,
    });

    if (slide.thumbHtml) {
      const ph = this._el('div', 'sn-thumb-placeholder');
      ph.innerHTML = slide.thumbHtml;
      th.appendChild(ph);
    } else {
      const src = slide.thumbSrc || slide.src;
      if (src) {
        const img = this._el('img', 'sn-thumb-img', {
          alt: '',
          'data-src': src,
        });
        th.appendChild(img);
      }
    }

    th.addEventListener('click', () => this.goTo(i));
    th.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') this.goTo(i); });
    return th;
  }

  _buildBtn(symbol, cls, label) {
    const btn = this._el('button', `sn-btn ${cls}`, { 'aria-label': label });
    btn.textContent = symbol;
    return btn;
  }

  /* ─────────────────────────── NAVIGATION ─────────────────────────── */

  _goTo(idx, animate = true) {
    const loop = this._opts.loop;
    if (loop) {
      idx = ((idx % this._total) + this._total) % this._total;
    } else {
      idx = Math.max(0, Math.min(this._total - 1, idx));
    }

    this._current = idx;

    if (!animate) this._track.classList.add('sn-no-transition');
    this._track.style.transform = `translateX(-${idx * 100}%)`;
    if (!animate) {
      requestAnimationFrame(() => this._track.classList.remove('sn-no-transition'));
    }

    // Update arrows
    if (this._prevBtn) this._prevBtn.classList.toggle('sn-btn--hidden', !loop && idx === 0);
    if (this._nextBtn) this._nextBtn.classList.toggle('sn-btn--hidden', !loop && idx === this._total - 1);

    // Update counter
    if (this._counterEl) this._counterEl.textContent = `${idx + 1} / ${this._total}`;

    // Update dots
    if (this._dotsEl) {
      this._dotsEl.querySelectorAll('.sn-dot').forEach((d, i) => {
        d.classList.toggle('sn-dot--active', i === idx);
        d.setAttribute('aria-selected', i === idx ? 'true' : 'false');
      });
    }

    // Update thumbnails
    const thumbs = this._rail.querySelectorAll('.sn-thumb');
    thumbs.forEach((t, i) => t.classList.toggle('sn-thumb--active', i === idx));
    if (thumbs[idx]) {
      thumbs[idx].scrollIntoView({ behavior: animate ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
    }

    // Update aria-hidden on slides
    this._track.querySelectorAll('.sn-slide').forEach((s, i) => {
      s.setAttribute('aria-hidden', i === idx ? 'false' : 'true');
    });

    if (typeof this._opts.onChange === 'function') {
      this._opts.onChange(idx);
    }
  }

  /* ─────────────────────────── PUBLIC API ─────────────────────────── */

  /** Navigate to a specific index */
  goTo(idx) { this._goTo(idx); }

  /** Go to next slide */
  next() { this._goTo(this._current + 1); }

  /** Go to previous slide */
  prev() { this._goTo(this._current - 1); }

  /** Current slide index */
  get currentIndex() { return this._current; }

  /** Total number of slides */
  get length() { return this._total; }

  /** Destroy the component and remove all listeners */
  destroy() {
    if (this._io) this._io.disconnect();
    if (this._keyHandler) document.removeEventListener('keydown', this._keyHandler);
    this._container.innerHTML = '';
    this._container.classList.remove('sn-root');
  }

  /* ─────────────────────────── EVENTS ─────────────────────────── */

  _bindEvents() {
    // Swipe — touch
    this._stage.addEventListener('touchstart', e => this._onDown(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    this._stage.addEventListener('touchmove', e => this._onMove(e.touches[0].clientX, e.touches[0].clientY, e), { passive: false });
    this._stage.addEventListener('touchend', () => this._onUp());

    // Swipe — mouse
    this._stage.addEventListener('mousedown', e => this._onDown(e.clientX, e.clientY));
    this._stage.addEventListener('mousemove', e => this._onMove(e.clientX, e.clientY, e));
    this._stage.addEventListener('mouseup', () => this._onUp());
    this._stage.addEventListener('mouseleave', () => { if (this._dragging) this._onUp(); });

    // Keyboard
    if (this._opts.keyboard) {
      this._keyHandler = (e) => {
        if (!this._container.contains(document.activeElement) && document.activeElement !== document.body) return;
        if (e.key === 'ArrowLeft') this.prev();
        else if (e.key === 'ArrowRight') this.next();
      };
      document.addEventListener('keydown', this._keyHandler);
    }
  }

  _onDown(x, y) {
    this._dragging = true;
    this._startX = x;
    this._startY = y;
    this._deltaX = 0;
  }

  _onMove(x, y, e) {
    if (!this._dragging) return;
    this._deltaX = x - this._startX;
    const dy = Math.abs(y - this._startY);
    if (dy > Math.abs(this._deltaX) * 1.5) { this._dragging = false; return; }
    if (e && e.cancelable) e.preventDefault();
    this._track.classList.add('sn-no-transition');
    this._track.style.transform = `translateX(calc(-${this._current * 100}% + ${this._deltaX}px))`;
  }

  _onUp() {
    if (!this._dragging) return;
    this._dragging = false;
    this._track.classList.remove('sn-no-transition');
    const threshold = this._stage.offsetWidth * 0.2;
    if (this._deltaX < -threshold) this.next();
    else if (this._deltaX > threshold) this.prev();
    else this._goTo(this._current);
  }

  /* ─────────────────────────── HELPERS ─────────────────────────── */

  _el(tag, classes = '', attrs = {}) {
    const el = document.createElement(tag);
    if (classes) el.className = classes.trim();
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }
}

export default PixCarousel;
