import type { ApiResponse } from "@/lib/api";
import { API_BASE_URL } from "@/shared/config/env";

type FetchPublicApiOptions = {
  revalidate?: number;
};

export async function fetchPublicApi<T>(
  path: string,
  options: FetchPublicApiOptions = {}
): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      next: { revalidate: options.revalidate ?? 30 },
    });

    const json = (await response.json()) as ApiResponse<T>;
    if (!json.result) {
      return null;
    }

    return json.data as T;
  } catch {
    return null;
  }
}
