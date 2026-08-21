import { request } from './client'

export interface Tab {
  id: number
  name: string
  color: string
  position: number
  created_at: string
  widgets: unknown[]
}

export function listTabs() {
  return request<Tab[]>('/tabs')
}

export function createTab(name: string, color: string, position = 0) {
  return request<Tab>('/tabs', {
    method: 'POST',
    body: JSON.stringify({ name, color, position }),
  })
}

export function updateTab(id: number, patch: Partial<Pick<Tab, 'name' | 'color' | 'position'>>) {
  return request<Tab>(`/tabs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export function deleteTab(id: number) {
  return request<void>(`/tabs/${id}`, { method: 'DELETE' })
}
