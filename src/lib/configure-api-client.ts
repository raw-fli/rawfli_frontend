import { configureApiClient } from "@rawfli/types";
import { getApiToken } from "@/lib/api";

let isApiClientConfigured = false;

export function ensureApiClientConfigured() {
  if (isApiClientConfigured) {
    return;
  }

  configureApiClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
    getToken: getApiToken,
  });

  isApiClientConfigured = true;
}
