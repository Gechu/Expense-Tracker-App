import { request } from './client'

export interface User {
  id: number
  email: string
  name: string | null
  avatar_color: string | null
  avatar_icon: string | null
}

export function register(email: string, password: string, name: string) {
  return request<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name: name || null }),
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

export function changePassword(currentPassword: string, newPassword: string) {
  return request<void>('/auth/me/password', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
}

export function changeEmail(newEmail: string, currentPassword: string) {
  return request<User>('/auth/me/email', {
    method: 'POST',
    body: JSON.stringify({ new_email: newEmail, current_password: currentPassword }),
  })
}

export function deleteAccount(currentPassword: string) {
  return request<void>('/auth/me/delete', {
    method: 'POST',
    body: JSON.stringify({ current_password: currentPassword }),
  })
}
