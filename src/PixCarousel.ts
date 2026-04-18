import type { Slide, PixCarouselOptions, PixCarouselInstance } from "./types"

export function createPixCarousel(
  container: HTMLElement,
  options: PixCarouselOptions
): PixCarouselInstance {
  const {
    slides,
    initialIndex = 0,
    showDots = true,
    showArrows = true,
    showCounter = true,
    thumbHeight = 80,
    thumbWidth = 120,
    accentColor = "#E8722A",
    swipeThreshold = 50,
    onChange,
  } = options

  let current = Math.max(0, Math.min(initialIndex, slides.length - 1))

  container.innerHTML = ""
  container.classList.add("sn-root")
  container.style.setProperty("--sn-accent", accentColor)

  const stage = el("div", "sn-stage")
  const track = el("div", "sn-track")

  slides.forEach((s, i) => {
    const slide = el("div", "sn-slide")
    const img = document.createElement("img")
    img.alt = s.alt ?? "Slide " + (i + 1)
    img.loading = "lazy"
    img.decoding = "async"
    const obs = new IntersectionObserver((entries, o) => {
      if (entries[0].isIntersecting) {
        img.src = s.src
        img.onload = () => img.classList.add("sn-loaded")
        o.disconnect()
      }
    }, { rootMargin: "200px" })
    obs.observe(slide)
    slide.appendChild(img)
    if (s.caption) {
      const cap = el("div", "sn-caption")
      cap.textContent = s.caption
      slide.appendChild(cap)
    }
    track.appendChild(slide)
  })

  stage.appendChild(track)

  const prevBtn = el<HTMLButtonElement>("button", "sn-btn sn-prev")
  prevBtn.innerHTML = "&#8249;"
  prevBtn.setAttribute("aria-label", "Previous slide")
  const nextBtn = el<HTMLButtonElement>("button", "sn-btn sn-next")
  nextBtn.innerHTML = "&#8250;"
  nextBtn.setAttribute("aria-label", "Next slide")
  if (showArrows) { stage.appendChild(prevBtn); stage.appendChild(nextBtn) }

  const dotsWrap = el("div", "sn-dots")
  if (showDots) {
    slides.forEach((_, i) => {
      const d = el<HTMLButtonElement>("button", "sn-dot")
      d.setAttribute("aria-label", "Go to slide " + (i + 1))
      d.addEventListener("click", () => goTo(i))
      dotsWrap.appendChild(d)
    })
    stage.appendChild(dotsWrap)
  }

  const counter = el("div", "sn-counter")
  if (showCounter) stage.appendChild(counter)
  container.appendChild(stage)

  const railWrap = el("div", "sn-rail-wrap")
  const rail = el("div", "sn-rail")

  slides.forEach((s, i) => {
    const thumb = el("div", "sn-thumb")
    thumb.style.width = thumbWidth + "px"
    thumb.style.height = thumbHeight + "px"
    const img = document.createElement("img")
    img.alt = s.alt ?? "Thumbnail " + (i + 1)
    img.loading = "lazy"
    const obs = new IntersectionObserver((entries, o) => {
      if (entries[0].isIntersecting) {
        img.src = s.thumbSrc ?? s.src
        img.onload = () => img.classList.add("sn-loaded")
        o.disconnect()
      }
    }, { root: rail, rootMargin: "300px" })
    obs.observe(thumb)
    thumb.appendChild(img)
    thumb.addEventListener("click", () => goTo(i))
    rail.appendChild(thumb)
  })

  railWrap.appendChild(rail)
  container.appendChild(railWrap)

  function render(smooth = true) {
    if (!smooth) track.classList.add("sn-no-transition")
    track.style.transform = "translateX(-" + (current * 100) + "%)"
    if (!smooth) requestAnimationFrame(() => track.classList.remove("sn-no-transition"))
    if (showArrows) { prevBtn.hidden = current === 0; nextBtn.hidden = current === slides.length - 1 }
    if (showCounter) counter.textContent = (current + 1) + " / " + slides.length
    if (showDots) Array.from(dotsWrap.children).forEach((d, i) => d.classList.toggle("sn-active", i === current))
    Array.from(rail.children).forEach((t, i) => t.classList.toggle("sn-active", i === current))
    const activeThumb = rail.children[current] as HTMLElement | undefined
    activeThumb?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }

  function goTo(index: number, smooth = true) {
    current = Math.max(0, Math.min(index, slides.length - 1))
    render(smooth)
    onChange?.(current, slides[current])
  }

  let dragStartX = 0, dragStartY = 0, isDragging = false, dragDelta = 0

  const onMouseDown  = (e: MouseEvent) => { dragStartX = e.clientX; dragStartY = e.clientY; isDragging = true; dragDelta = 0 }
  const onMouseMove  = (e: MouseEvent) => {
    if (!isDragging) return
    dragDelta = e.clientX - dragStartX
    track.classList.add("sn-no-transition")
    track.style.transform = "translateX(calc(-" + (current * 100) + "% + " + dragDelta + "px))"
  }
  const onMouseUp    = () => {
    if (!isDragging) return
    isDragging = false
    track.classList.remove("sn-no-transition")
    if (dragDelta < -swipeThreshold && current < slides.length - 1) goTo(current + 1)
    else if (dragDelta > swipeThreshold && current > 0) goTo(current - 1)
    else goTo(current)
  }
  const onTouchStart = (e: TouchEvent) => { dragStartX = e.touches[0].clientX; dragStartY = e.touches[0].clientY; isDragging = true; dragDelta = 0 }
  const onTouchMove  = (e: TouchEvent) => {
    if (!isDragging) return
    dragDelta = e.touches[0].clientX - dragStartX
    const dy = Math.abs(e.touches[0].clientY - dragStartY)
    if (dy > Math.abs(dragDelta) * 1.5) { isDragging = false; return }
    if (e.cancelable) e.preventDefault()
    track.classList.add("sn-no-transition")
    track.style.transform = "translateX(calc(-" + (current * 100) + "% + " + dragDelta + "px))"
  }

  stage.addEventListener("mousedown",  onMouseDown)
  stage.addEventListener("mousemove",  onMouseMove)
  stage.addEventListener("mouseup",   onMouseUp)
  stage.addEventListener("mouseleave", onMouseUp)
  stage.addEventListener("touchstart", onTouchStart, { passive: true })
  stage.addEventListener("touchmove",  onTouchMove,  { passive: false })
  stage.addEventListener("touchend",   onMouseUp)

  let railDragging = false
  const onRailDown = () => { railDragging = true }
  const onRailMove = (e: MouseEvent) => { if (railDragging) rail.scrollLeft -= e.movementX }
  const onRailUp   = () => { railDragging = false }
  rail.addEventListener("mousedown",  onRailDown)
  rail.addEventListener("mousemove",  onRailMove)
  rail.addEventListener("mouseup",    onRailUp)
  rail.addEventListener("mouseleave", onRailUp)

  prevBtn.addEventListener("click", () => goTo(current - 1))
  nextBtn.addEventListener("click", () => goTo(current + 1))

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft")  goTo(current - 1)
    if (e.key === "ArrowRight") goTo(current + 1)
  }
  document.addEventListener("keydown", onKeyDown)
  render(false)

  return {
    goTo,
    next: () => goTo(current + 1),
    prev: () => goTo(current - 1),
    get currentIndex() { return current },
    destroy() {
      stage.removeEventListener("mousedown",  onMouseDown)
      stage.removeEventListener("mousemove",  onMouseMove)
      stage.removeEventListener("mouseup",   onMouseUp)
      stage.removeEventListener("mouseleave", onMouseUp)
      stage.removeEventListener("touchstart", onTouchStart)
      stage.removeEventListener("touchmove",  onTouchMove)
      stage.removeEventListener("touchend",   onMouseUp)
      rail.removeEventListener("mousedown",  onRailDown)
      rail.removeEventListener("mousemove",  onRailMove)
      rail.removeEventListener("mouseup",    onRailUp)
      rail.removeEventListener("mouseleave", onRailUp)
      document.removeEventListener("keydown", onKeyDown)
      container.innerHTML = ""
      container.classList.remove("sn-root")
    }
  }
}

function el<T extends HTMLElement = HTMLElement>(tag: string, classes: string): T {
  const node = document.createElement(tag) as T
  classes.split(" ").filter(Boolean).forEach(c => node.classList.add(c))
  return node
}
