import { request } from './client'

export interface User {
  id: number
  email: string
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
