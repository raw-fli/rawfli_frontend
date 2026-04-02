import { awsControllerCreateUploadPresignedUrls } from "@rawfli/types";

export const SUPPORTED_UPLOAD_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/tiff",
  "image/bmp",
  "image/x-canon-cr2",
  "image/x-nikon-nef",
  "image/x-sony-arw",
  "image/x-adobe-dng",
  "image/x-fuji-raf",
] as const;

export type UploadedImageInfo = {
  imageId: string;
  key: string;
};

type PresignedUploadInfo = {
  imageId: string;
  key: string;
  uploadUrl: string;
  contentType: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPresignedUploadInfo(value: unknown): value is PresignedUploadInfo {
  if (!isRecord(value)) return false;

  return (
    typeof value.imageId === "string" &&
    typeof value.key === "string" &&
    typeof value.uploadUrl === "string" &&
    typeof value.contentType === "string"
  );
}

function extractPresignedUploads(payload: unknown): PresignedUploadInfo[] {
  if (!isRecord(payload)) return [];

  const topLevelUploads = payload.uploads;
  if (Array.isArray(topLevelUploads)) {
    return topLevelUploads.filter(isPresignedUploadInfo);
  }

  const dataLevel = payload.data;
  if (!isRecord(dataLevel)) return [];

  if (Array.isArray(dataLevel.uploads)) {
    return dataLevel.uploads.filter(isPresignedUploadInfo);
  }

  const nestedData = dataLevel.data;
  if (!isRecord(nestedData) || !Array.isArray(nestedData.uploads)) return [];
  return nestedData.uploads.filter(isPresignedUploadInfo);
}

export async function uploadImagesWithPresignedUrls(files: File[]): Promise<UploadedImageInfo[]> {
  if (files.length === 0) return [];

  const response = await awsControllerCreateUploadPresignedUrls({
    files: files.map((file) => ({
      originalName: file.name,
      contentType: file.type,
      size: file.size,
    })),
  });

  const uploads = extractPresignedUploads(response);
  if (uploads.length !== files.length) {
    throw new Error("Presigned upload response mismatch.");
  }

  await Promise.all(
    uploads.map(async (upload, index) => {
      const file = files[index];
      const putResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": upload.contentType || file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!putResponse.ok) {
        throw new Error(`S3 upload failed with status ${putResponse.status}.`);
      }
    }),
  );

  return uploads.map((upload) => ({
    imageId: upload.imageId,
    key: upload.key,
  }));
}
