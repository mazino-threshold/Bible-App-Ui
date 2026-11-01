const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/** An error to show the user. status is 0 when the server couldn't be reached. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Validation messages by field name, e.g. { email: 'Enter a valid email address' } */
    public fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Called by the session: every request after this sends the token. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Called when a signed-in request gets 401, i.e. the session has expired. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export async function api<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const sentToken = authToken;
  if (sentToken) headers.Authorization = `Bearer ${sentToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your internet connection and try again");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Only sign out if this token was rejected, not one replaced while the request was in flight
    if (res.status === 401 && sentToken && sentToken === authToken) onUnauthorized?.();

    const fields: Record<string, string> = {};
    for (const d of data?.details ?? []) {
      if (d.field && !fields[d.field]) fields[d.field] = d.message;
    }
    throw new ApiError(res.status, data?.error ?? 'Something went wrong. Please try again', fields);
  }

  return data as T;
}

/** The message to show for any error thrown while calling the API. */
export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Something went wrong. Please try again';
}
