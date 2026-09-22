import { request } from './client'
import type { Widget } from './widgets'

export interface Pin {
  id: number
  position: number
  /** dane zakładki ŹRÓDŁOWEJ widgetu - do pokolorowania karty wg pochodzenia */
  tab_id: number
  tab_name: string
  tab_color: string
  widget: Widget
}

export function listPins() {
  return request<Pin[]>('/pins')
}

export function pinWidget(widgetId: number, position = 0) {
  return request<Pin>('/pins', {
    method: 'POST',
    body: JSON.stringify({ widget_id: widgetId, position }),
  })
}

export function updatePinPosition(id: number, position: number) {
  return request<Pin>(`/pins/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ position }),
  })
}

export function unpin(id: number) {
  return request<void>(`/pins/${id}`, { method: 'DELETE' })
}
