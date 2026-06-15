import { SERVER_URL } from '../constants.js';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Thin fetch wrapper that throws ApiError on non-2xx. */
export async function apiFetch<T>(path: string, etag?: string): Promise<{ data: T; etag: string | null }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (etag) headers['If-None-Match'] = etag;

  const res = await fetch(`${SERVER_URL}${path}`, { headers });

  if (res.status === 304) {
    // Caller should use cached data; return null as a sentinel
    return { data: null as unknown as T, etag };
  }

  if (!res.ok) {
    throw new ApiError(res.status, `${path} → ${res.status}`);
  }

  const data = (await res.json()) as T;
  return { data, etag: res.headers.get('ETag') };
}
