const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { token, ...options } = {}) {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Не удалось связаться с сервером. Проверьте подключение и повторите попытку.');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    if (response.ok) throw new ApiError('Сервер вернул некорректный ответ.', response.status);
  }

  if (!response.ok) {
    const details = Array.isArray(payload?.details) ? payload.details.join('. ') : '';
    const message = [payload?.error, details].filter(Boolean).join(': ')
      || `Ошибка сервера (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return payload;
}

export async function login(email, password) {
  const response = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (typeof response?.token !== 'string' || !response.user) {
    throw new ApiError('Сервер не вернул токен авторизации.');
  }
  return response;
}

export async function getTrips(token, { signal } = {}) {
  const response = await request('/trips', { token, signal });
  if (!Array.isArray(response?.data)) {
    throw new ApiError('Сервер вернул список путевых листов в неверном формате.');
  }
  return response.data;
}

export async function createTrip(token, trip) {
  const response = await request('/trips', {
    method: 'POST',
    token,
    body: JSON.stringify(trip)
  });
  if (!response?.data || typeof response.data.id !== 'number') {
    throw new ApiError('Сервер не вернул созданный путевой лист.');
  }
  return response.data;
}

export async function updateTrip(token, id, trip) {
  const response = await request(`/trips/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: JSON.stringify(trip)
  });
  if (!response?.data || typeof response.data.id !== 'number') {
    throw new ApiError('Сервер не вернул обновлённый путевой лист.');
  }
  return response.data;
}

export async function deleteTrip(token, id) {
  return request(`/trips/${encodeURIComponent(id)}`, { method: 'DELETE', token });
}
