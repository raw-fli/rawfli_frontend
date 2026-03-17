export class ApiError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

type ApiErrorResponse = {
  code?: number;
  data?: unknown;
  message?: string | string[];
};

export function getApiToken(): string | null {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return localStorage.getItem("admin-token");
  }

  return localStorage.getItem("token");
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "요청 처리 중 오류가 발생했습니다.",
): string {
  const response = (error as { response?: { data?: ApiErrorResponse } })?.response?.data;

  if (typeof response?.data === "string" && response.data.trim()) {
    return response.data;
  }

  if (Array.isArray(response?.message)) {
    return response.message[0] ?? fallback;
  }

  if (typeof response?.message === "string" && response.message.trim()) {
    return response.message;
  }

  return fallback;
}

export function isUnauthorizedError(error: unknown): boolean {
  const response = (error as { response?: { status?: number; data?: ApiErrorResponse } })?.response;
  return response?.status === 401 || response?.data?.code === 4002;
}
