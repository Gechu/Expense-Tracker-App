import { request } from './client'

export interface User {
  id: number
  email: string
  name: string | null
  avatar_color: string | null
  avatar_icon: string | null
}

export function register(email: string, password: string) {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function login(email: string, password: string) {
  return request<User>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout() {
  return request<void>('/auth/logout', { method: 'POST' })
}

export function me() {
  return request<User>('/auth/me')
}

export function updateMe(patch: Partial<Pick<User, 'name' | 'avatar_color' | 'avatar_icon'>>) {
  return request<User>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}
