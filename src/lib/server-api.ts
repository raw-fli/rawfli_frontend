import { configureApiClient } from "@rawfli/types";

configureApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
});
