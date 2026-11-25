const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Indispensable para enviar/recibir la cookie HttpOnly de Admin
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}
