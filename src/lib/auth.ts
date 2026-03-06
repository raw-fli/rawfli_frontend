import { authControllerLogin, authControllerSignUp, CreateUserDto, LoginUserDto } from "@rawfli/types";

export const authApi = {
  signup: (data: CreateUserDto) =>
    authControllerSignUp(data),

  login: (data: LoginUserDto) =>
    authControllerLogin(data),
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
