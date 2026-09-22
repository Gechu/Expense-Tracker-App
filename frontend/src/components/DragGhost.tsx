import { createPortal } from 'react-dom'
import type { DragGhostSnapshot } from '../hooks/useDragReorder'

interface DragGhostProps {
  ghost: DragGhostSnapshot | null
}

/** Unosząca się, wizualna kopia przeciąganego elementu, podążająca za
 * kursorem/palcem - zwykła migawka (outerHTML) zrobiona w chwili chwycenia,
 * nie żywy klon, więc nie trzeba jej aktualizować przy zmianach danych.
 * Portal do document.body, żeby nic (np. przewijane listy) jej nie ucinało. */
export default function DragGhost({ ghost }: DragGhostProps) {
  if (!ghost) return null

  return createPortal(
    <div
      className="drag-ghost"
      style={{
        left: ghost.x,
        top: ghost.y,
        width: ghost.width,
        height: ghost.height,
      }}
      dangerouslySetInnerHTML={{ __html: ghost.html }}
    />,
    document.body,
  )
}
