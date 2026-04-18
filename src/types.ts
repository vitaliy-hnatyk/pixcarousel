export interface Slide {
  src: string
  alt?: string
  thumbSrc?: string
  caption?: string
}

export interface PixCarouselOptions {
  slides: Slide[]
  initialIndex?: number
  showDots?: boolean
  showArrows?: boolean
  showCounter?: boolean
  thumbHeight?: number
  thumbWidth?: number
  accentColor?: string
  swipeThreshold?: number
  onChange?: (index: number, slide: Slide) => void
}

export interface PixCarouselInstance {
  goTo(index: number): void
  next(): void
  prev(): void
  destroy(): void
  readonly currentIndex: number
}
