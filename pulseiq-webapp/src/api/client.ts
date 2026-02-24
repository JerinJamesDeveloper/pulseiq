// ─── HTTP CLIENT ──────────────────────────────────────────────────────────────
// A lightweight HTTP client wrapper around fetch with:
//   - Configurable base URL
//   - Automatic JSON serialization/deserialization
//   - Error handling with typed errors
//   - Request/response interceptors
//   - Timeout support
//   - Offline detection

import type { ApiError } from "./types";

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  headers: Record<string, string>;
}

const DEFAULT_CONFIG: ApiClientConfig = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

let config: ApiClientConfig = { ...DEFAULT_CONFIG };

export function configureApi(overrides: Partial<ApiClientConfig>): void {
  config = { ...config, ...overrides };
}

export function getApiConfig(): ApiClientConfig {
  return { ...config };
}

// ─── ERROR CLASS ──────────────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  public statusCode: number;
  public details?: Record<string, string[]>;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.name = "ApiRequestError";
    this.statusCode = apiError.statusCode;
    this.details = apiError.details;
  }
}

export class NetworkError extends Error {
  constructor(message = "Network error – the API server may be unreachable") {
    super(message);
    this.name = "NetworkError";
  }
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

// ─── CORE REQUEST FUNCTION ────────────────────────────────────────────────────

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${config.baseUrl}${path}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: { ...config.headers },
      signal: controller.signal,
    };

    if (body !== undefined && method !== "GET" && method !== "DELETE") {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    clearTimeout(timeoutId);

    if (!response.ok) {
      let apiError: ApiError;
      try {
        apiError = await response.json();
      } catch {
        apiError = {
          error: response.statusText,
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }
      throw new ApiRequestError(apiError);
    }

    // Handle 204 No Content (e.g., DELETE responses)
    if (response.status === 204) {
      return undefined as T;
    }

    const data: T = await response.json();
    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof ApiRequestError) throw err;

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new TimeoutError(config.timeout);
    }

    // Network-level failure (server unreachable, CORS, DNS, etc.)
    throw new NetworkError();
  }
}

// ─── PUBLIC HTTP METHODS ──────────────────────────────────────────────────────

export const http = {
  get: <T>(path: string) => request<T>("GET", path),

  post: <T>(path: string, body: unknown) => request<T>("POST", path, body),

  put: <T>(path: string, body: unknown) => request<T>("PUT", path, body),

  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),

  delete: <T>(path: string) => request<T>("DELETE", path),
};

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    await http.get<{ status: string }>("/health");
    return true;
  } catch {
    return false;
  }
}
