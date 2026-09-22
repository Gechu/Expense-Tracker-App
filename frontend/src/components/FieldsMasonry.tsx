import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

const CARD_WIDTH = 286
const GAP = 15

interface FieldsMasonryProps<T extends { id: number }> {
  widgets: T[]
  renderCard: (item: T) => ReactNode
}

/**
 * Układ typu "murek" liczony ręcznie (zamiast CSS `column-width`), bo
 * ten drugi ma w Chromium błąd: przy zmianie zawartości potrafi
 * przemalować za duży, źle wyliczony obszar sięgający w głąb kolejnej
 * kolumny, zostawiając widoczny artefakt starej klatki do najbliższej
 * interakcji. Tutaj każda kolumna to osobny, zwykły blok - karta
 * dokładana jest zawsze do aktualnie najkrótszej kolumny.
 */
export default function FieldsMasonry<T extends { id: number }>({ widgets, renderCard }: FieldsMasonryProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef(new Map<number, HTMLDivElement>())
  const [columns, setColumns] = useState<T[][]>(() => [widgets])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    function layout() {
      const width = container!.clientWidth
      const columnCount = Math.max(1, Math.floor((width + GAP) / (CARD_WIDTH + GAP)))
      const heights = new Array(columnCount).fill(0)
      const next: T[][] = Array.from({ length: columnCount }, () => [])

      for (const widget of widgets) {
        const height = cardRefs.current.get(widget.id)?.offsetHeight ?? 0
        let shortest = 0
        for (let i = 1; i < columnCount; i++) {
          if (heights[i] < heights[shortest]) shortest = i
        }
        next[shortest].push(widget)
        heights[shortest] += height + GAP
      }

      setColumns(next)
    }

    layout()
    const observer = new ResizeObserver(layout)
    observer.observe(container)
    return () => observer.disconnect()
  }, [widgets])

  return (
    <div ref={containerRef} className="fields-grid">
      {columns.map((column, index) => (
        <div key={index} className="fields-column">
          {column.map((widget) => (
            <div
              key={widget.id}
              ref={(el) => {
                if (el) cardRefs.current.set(widget.id, el)
                else cardRefs.current.delete(widget.id)
              }}
            >
              {renderCard(widget)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
