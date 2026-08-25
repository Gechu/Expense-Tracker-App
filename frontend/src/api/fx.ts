import { request } from './client'

export function getFxRate(from: string, to: string) {
  return request<{ rate: number }>(`/fx-rate?from=${from}&to=${to}`)
}
