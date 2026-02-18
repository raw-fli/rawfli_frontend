import { S3_IMAGE_BASE_URL } from "@/shared/config/env";

export function toS3ImageUrl(key?: string): string | undefined {
  if (!key) return undefined;
  return `${S3_IMAGE_BASE_URL}/${encodeURI(key)}`;
}