import { request } from './client'

export type WidgetType = 'single_value' | 'table' | 'formula' | 'currency'

export interface WidgetEntry {
  id: number
  label: string | null
  amount: string
  entry_date: string
  position: number
  created_at: string
}

export interface Widget {
  id: number
  tab_id: number
  type: WidgetType
  label: string
  position: number
  config: Record<string, unknown> | null
  created_at: string
  updated_at: string | null
  entries: WidgetEntry[]
  value: string | null
}

export function createWidget(tabId: number, type: WidgetType, label: string, position = 0) {
  return request<Widget>(`/tabs/${tabId}/widgets`, {
    method: 'POST',
    body: JSON.stringify({ type, label, position }),
  })
}

export function updateWidget(id: number, patch: Partial<Pick<Widget, 'label' | 'position'>>) {
  return request<Widget>(`/widgets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteWidget(id: number) {
  return request<void>(`/widgets/${id}`, { method: 'DELETE' })
}

export interface EntryInput {
  label?: string | null
  amount: number | string
  entry_date: string
  position?: number
}

export function createEntry(widgetId: number, entry: EntryInput) {
  return request<Widget>(`/widgets/${widgetId}/entries`, {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}

export function updateEntry(entryId: number, patch: Partial<EntryInput>) {
  return request<Widget>(`/entries/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteEntry(entryId: number) {
  return request<void>(`/entries/${entryId}`, { method: 'DELETE' })
}
