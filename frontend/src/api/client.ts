const API_URL = 'http://localhost:8000'

/* Współdzielony fetch wrapper - dorzuca ciasteczko sesji (credentials),
   nagłówek JSON i zamienia odpowiedzi z błędem na wyjątek z czytelnym
   komunikatem z backendu (pole "detail"). Pliki per domena (auth.ts,
   tabs.ts...) budują na tym swoje konkretne wywołania. */
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail ?? `Błąd żądania (${response.status})`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}
