import { API_BASE_URL } from "@/shared/config/env";
import { getToken } from "@/lib/auth";

export interface ApiResponse<T> {
  result: boolean;
  code: number;
  data: T | string;
}

class ApiError extends Error {
  code: number;

  constructor(message: string, code: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.result) {
    const errorMessage = typeof json.data === "string" ? json.data : "알 수 없는 에러가 발생했습니다.";
    throw new ApiError(errorMessage, json.code);
  }

  return json.data as T;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),

  upload: async <T>(endpoint: string, file: File): Promise<T> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("image", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: formData,
    });

    const json: ApiResponse<T> = await res.json();

    if (!json.result) {
      const errorMessage = typeof json.data === "string" ? json.data : "업로드 중 에러가 발생했습니다.";
      throw new ApiError(errorMessage, json.code);
    }

    return json.data as T;
  },
};

export { ApiError };
