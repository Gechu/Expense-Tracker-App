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

export const FORMULA_OPERATORS = ['+', '-', '*', '/', '(', ')'] as const
export type FormulaOperator = (typeof FORMULA_OPERATORS)[number]

/** Kształt "config" dla type="formula" - budowane klikaniem wyrażenie:
   odwołania do pól, liczby i operatory (w tym nawiasy), liczone z zachowaniem
   normalnego priorytetu działań (* / przed + -). */
export type FormulaToken =
  | { kind: 'field'; widget_id: number }
  | { kind: 'number'; value: number }
  | { kind: 'op'; value: FormulaOperator }

export interface FormulaConfig {
  tokens: FormulaToken[]
}

/** Kształt "config" dla type="currency" - kurs wpisywany ręcznie */
export interface CurrencyConfig {
  amount: number
  from_currency: string
  to_currency: string
  rate: number
}

export interface Widget {
  id: number
  tab_id: number
  type: WidgetType
  label: string
  position: number
  config: FormulaConfig | CurrencyConfig | null
  created_at: string
  updated_at: string | null
  entries: WidgetEntry[]
  value: string | null
}

export function createWidget(
  tabId: number,
  type: WidgetType,
  label: string,
  position = 0,
  config?: FormulaConfig | CurrencyConfig,
) {
  return request<Widget>(`/tabs/${tabId}/widgets`, {
    method: 'POST',
    body: JSON.stringify({ type, label, position, config }),
  })
}

export function updateWidget(id: number, patch: Partial<Pick<Widget, 'label' | 'position' | 'config'>>) {
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
