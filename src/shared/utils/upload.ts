type UploadedImageInfo = {
  id?: string;
  key?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toUploadedImagesFromArray(items: unknown[]): UploadedImageInfo[] {
  const result: UploadedImageInfo[] = [];

  for (const item of items) {
    if (!isRecord(item)) continue;

    const id = typeof item.id === "string" ? item.id : undefined;
    const key = typeof item.key === "string" ? item.key : undefined;

    if (!id && !key) continue;
    result.push({ id, key });
  }

  return result;
}

export function extractUploadedImages(payload: unknown): UploadedImageInfo[] {
  if (Array.isArray(payload)) {
    return toUploadedImagesFromArray(payload);
  }

  if (!isRecord(payload)) {
    return [];
  }

  const maybeData = payload.data;
  if (Array.isArray(maybeData)) {
    return toUploadedImagesFromArray(maybeData);
  }

  if (isRecord(maybeData) && Array.isArray(maybeData.data)) {
    return toUploadedImagesFromArray(maybeData.data);
  }

  return [];
}

export function extractUploadedImageIds(payload: unknown): string[] {
  return extractUploadedImages(payload)
    .map((item) => item.id)
    .filter((id): id is string => !!id);
}

export function extractUploadedImageKeys(payload: unknown): string[] {
  return extractUploadedImages(payload)
    .map((item) => item.key)
    .filter((key): key is string => !!key);
}
