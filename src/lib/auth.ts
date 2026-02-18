import { api } from "./api";
import type { SignupRequest, SignupResponse, LoginRequest, LoginResponse } from "./types";

export const authApi = {
  signup: (data: SignupRequest) =>
    api.post<SignupResponse>("/api/v1/auth/signup", data),

  login: (data: LoginRequest) =>
    api.post<LoginResponse>("/api/v1/auth/login", data),
};

export function saveToken(token: string) {
  localStorage.setItem("token", token);
}

export function removeToken() {
  localStorage.removeItem("token");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
