import { API_BASE_URL } from "./config";
import { ApiError } from "./errors";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Extra headers such as x-api-key — never logged. */
  apiKey?: string;
}

function buildHeaders(options: RequestOptions): Headers {
  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (options.apiKey?.trim()) {
    headers.set("x-api-key", options.apiKey.trim());
  }
  return headers;
}

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown;
  let message = `HTTP ${res.status}`;
  try {
    body = await res.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      (typeof (body as { message: unknown }).message === "string" ||
        Array.isArray((body as { message: unknown }).message))
    ) {
      const m = (body as { message: string | string[] }).message;
      message = Array.isArray(m) ? m.join(", ") : m;
    }
  } catch {
    try {
      message = (await res.text()) || message;
    } catch {
      /* ignore */
    }
  }
  return new ApiError(message, res.status, body);
}

/** JSON request helper for non-streaming endpoints. */
export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? (options.body !== undefined ? "POST" : "GET"),
    headers: buildHeaders(options),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Low-level POST that returns the raw Response (for SSE). */
export async function httpStream(
  path: string,
  options: RequestOptions & { body: unknown },
): Promise<Response> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: buildHeaders(options),
    body: JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!res.ok) throw await parseError(res);
  if (!res.body) throw new ApiError("Empty stream response", res.status);
  return res;
}
