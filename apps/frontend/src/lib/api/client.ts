import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST INTERCEPTOR ──────────────────────────────────────────────────────
// Attach JWT access token to every request
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── RESPONSE INTERCEPTOR ─────────────────────────────────────────────────────
// Unwrap { success, data } envelope; handle 401 refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Unwrap the standard API envelope
    if (response.data?.success !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/v1/auth/refresh`, {
          refreshToken,
        });

        setTokens(data.accessToken, data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        return apiClient(originalRequest);
      } catch {
        clearTokens();
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(formatError(error));
  },
);

// ─── TOKEN MANAGEMENT ─────────────────────────────────────────────────────────
// In production: use httpOnly cookies instead of localStorage

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('evoline_medslot_access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('evoline_medslot_refresh_token');
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem('evoline_medslot_access_token', accessToken);
  localStorage.setItem('evoline_medslot_refresh_token', refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem('evoline_medslot_access_token');
  localStorage.removeItem('evoline_medslot_refresh_token');
}

// ─── ERROR FORMATTING ─────────────────────────────────────────────────────────

export interface ApiError {
  message: string | string[];
  statusCode: number;
}

function formatError(error: AxiosError): ApiError {
  const data = error.response?.data as any;
  return {
    message: data?.message || 'Something went wrong. Please try again.',
    statusCode: error.response?.status || 500,
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = (error as ApiError).message;
    return Array.isArray(msg) ? msg.join(', ') : msg;
  }
  return 'An unexpected error occurred';
}
