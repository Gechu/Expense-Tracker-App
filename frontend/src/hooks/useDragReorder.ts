import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

/** Migawka przeciąganego elementu do narysowania "unoszącej się" kopii,
 * która podąża za kursorem/palcem - patrz komponent DragGhost. */
export interface DragGhostSnapshot {
  html: string
  width: number
  height: number
  x: number
  y: number
}

/** Powierzchnia sterowania przeciąganiem, przekazywana w dół jako jeden prop
 * (zamiast kilku osobnych) do komponentów renderujących karty/wiersze. */
export interface DragReorderControls {
  draggedId: number | null
  overId: number | null
  ghost: DragGhostSnapshot | null
  registerNode: (id: number, el: HTMLElement | null) => void
  handlePointerDown: (id: number, event: ReactPointerEvent<Element>) => void
  handlePointerMove: (event: ReactPointerEvent<Element>) => void
  handlePointerUp: (event: ReactPointerEvent<Element>) => void
}

const AUTOSCROLL_EDGE = 60
const AUTOSCROLL_MAX_SPEED = 16

/** Najbliższy scrollowalny przodek - a jeśli nie ma żadnego (np. na mobile,
 * gdzie to cała strona się przewija), null oznacza "przewijaj okno". */
function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node && node !== document.body) {
    const style = getComputedStyle(node)
    if (/(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      return node
    }
    node = node.parentElement
  }
  return null
}

/**
 * Przeciąganie do zmiany kolejności oparte o Pointer Events (nie natywne
 * HTML5 Drag and Drop) - to drugie w ogóle nie działa na dotyku (telefon,
 * tablet), bo przeglądarki mobilne nie inicjują "dragstart" z palca.
 * Pointer Events działają tak samo dla myszy i dotyku, więc jeden
 * mechanizm obsługuje oba przypadki.
 *
 * Uchwyt do przeciągania musi ustawić na sobie `onPointerDown={(e) =>
 * handlePointerDown(id, e)}` i mieć w CSS `touch-action: none` (inaczej
 * przeglądarka i tak zacznie przewijać stronę zamiast przekazać gest tutaj).
 * Element całej karty/wiersza musi zarejestrować się przez `registerNode`,
 * żeby dało się wykryć, nad którym elementem aktualnie jest wskaźnik.
 *
 * Przy okazji: rysuje unoszącą się kopię przeciąganego elementu (`ghost`,
 * do wyrenderowania przez <DragGhost>) i sam przewija najbliższy scrollowalny
 * kontener (albo całe okno), gdy wskaźnik dojedzie blisko jego krawędzi.
 *
 * Wydajność: `onPointerMove` samo w sobie tylko zapisuje pozycję do refa -
 * nic więcej. Cała "ciężka" praca (hit-testing, przewijanie, pozycja
 * duszka - każda z nich czyta layout i/lub aktualizuje stan) dzieje się
 * raz na klatkę animacji (requestAnimationFrame), a nie przy każdym
 * surowym zdarzeniu dotyku - tych potrafi być dużo więcej niż 60/s, więc
 * bez tego ograniczenia React renderował całą aplikację dziesiątki razy
 * na sekundę, co na telefonie dawało odczuwalne lagi.
 */
export function useDragReorder<T extends { id: number }>(
  items: T[],
  onReorder: (reordered: T[]) => void,
): DragReorderControls {
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [overId, setOverId] = useState<number | null>(null)
  const [ghost, setGhost] = useState<DragGhostSnapshot | null>(null)
  const nodesRef = useRef(new Map<number, HTMLElement>())
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const scrollParentRef = useRef<HTMLElement | null>(null)
  const pointerRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  // Bieżący stan przeciągania trzymany też w refach - pętla rAF startuje raz
  // (z zamkniętej wersji swojej funkcji) i musi widzieć AKTUALNE wartości,
  // a nie te "zamrożone" ze stanu Reacta z chwili, gdy się zaczęła.
  const draggedIdRef = useRef<number | null>(null)
  const overIdRef = useRef<number | null>(null)

  function registerNode(id: number, el: HTMLElement | null) {
    if (el) nodesRef.current.set(id, el)
    else nodesRef.current.delete(id)
  }

  function findTargetId(x: number, y: number): number | null {
    for (const [id, el] of nodesRef.current) {
      const rect = el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return id
      }
    }
    return null
  }

  function applyAutoScroll() {
    const container = scrollParentRef.current
    const rect = container ? container.getBoundingClientRect() : { top: 0, bottom: window.innerHeight }
    const y = pointerRef.current.y
    let delta = 0
    if (y < rect.top + AUTOSCROLL_EDGE) {
      delta = -AUTOSCROLL_MAX_SPEED * (1 - Math.max(0, y - rect.top) / AUTOSCROLL_EDGE)
    } else if (y > rect.bottom - AUTOSCROLL_EDGE) {
      delta = AUTOSCROLL_MAX_SPEED * (1 - Math.max(0, rect.bottom - y) / AUTOSCROLL_EDGE)
    }
    if (delta !== 0) {
      if (container) container.scrollTop += delta
      else window.scrollBy(0, delta)
    }
  }

  /** Cała praca liczona raz na klatkę: autoscroll, hit-testing (kogo
   * aktualnie jest "nad") i pozycja unoszącej się kopii. */
  function frameTick() {
    if (draggedIdRef.current == null) {
      rafRef.current = null
      return
    }

    applyAutoScroll()

    const targetId = findTargetId(pointerRef.current.x, pointerRef.current.y)
    const nextOver = targetId != null && targetId !== draggedIdRef.current ? targetId : null
    if (nextOver !== overIdRef.current) {
      overIdRef.current = nextOver
      setOverId(nextOver)
    }

    setGhost((current) =>
      current
        ? {
            ...current,
            x: pointerRef.current.x - dragOffsetRef.current.x,
            y: pointerRef.current.y - dragOffsetRef.current.y,
          }
        : current,
    )

    rafRef.current = requestAnimationFrame(frameTick)
  }

  function handlePointerDown(id: number, event: ReactPointerEvent<Element>) {
    // Capture może się nie udać (np. na niektórych przeglądarkach/urządzeniach) -
    // przeciąganie ma wtedy nadal ruszyć, tylko bez gwarancji, że move/up
    // zostaną na tym samym elemencie, gdy palec/kursor zjedzie poza uchwyt.
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // ignorowane celowo
    }

    const node = nodesRef.current.get(id)
    if (node) {
      const rect = node.getBoundingClientRect()
      dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
      setGhost({ html: node.outerHTML, width: rect.width, height: rect.height, x: rect.left, y: rect.top })
      scrollParentRef.current = findScrollParent(node)
    }

    pointerRef.current = { x: event.clientX, y: event.clientY }
    draggedIdRef.current = id
    overIdRef.current = null
    setDraggedId(id)
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(frameTick)
  }

  function handlePointerMove(event: ReactPointerEvent<Element>) {
    if (draggedIdRef.current == null) return
    event.preventDefault()
    pointerRef.current = { x: event.clientX, y: event.clientY }
  }

  function handlePointerUp(event: ReactPointerEvent<Element>) {
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignorowane celowo - patrz komentarz w handlePointerDown
    }
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    scrollParentRef.current = null

    const sourceId = draggedIdRef.current
    const targetId = overIdRef.current
    draggedIdRef.current = null
    overIdRef.current = null

    if (sourceId != null && targetId != null && targetId !== sourceId) {
      const ordered = [...items]
      const fromIndex = ordered.findIndex((item) => item.id === sourceId)
      const toIndex = ordered.findIndex((item) => item.id === targetId)
      if (fromIndex !== -1 && toIndex !== -1) {
        const [moved] = ordered.splice(fromIndex, 1)
        ordered.splice(toIndex, 0, moved)
        onReorder(ordered)
      }
    }
    setDraggedId(null)
    setOverId(null)
    setGhost(null)
  }

  return {
    draggedId,
    overId,
    ghost,
    registerNode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
