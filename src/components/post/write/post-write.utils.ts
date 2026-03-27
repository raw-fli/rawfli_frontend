import { MyImageItemResponseDto } from "@rawfli/types";
import { PhotoDraft } from "./post-write.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toNumericString(value?: number | null): string {
  if (value === undefined || value === null) return "";
  return String(value);
}

export function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function createDraft(image: MyImageItemResponseDto): PhotoDraft {
  return {
    description: "",
    cameraBrand: image.cameraMake ?? "",
    cameraModel: image.cameraModel ?? "",
    lensBrand: image.lensMake ?? "",
    lensModel: image.lensModel ?? "",
    iso: toNumericString(image.iso),
    shutterSpeed: image.shutterSpeedDisplay ?? "",
    aperture: toNumericString(image.aperture),
    focalLength: toNumericString(image.focalLength),
  };
}

export function extractMyImages(payload: unknown): MyImageItemResponseDto[] {
  if (!isRecord(payload)) return [];
  const maybeData = payload.data;
  if (!isRecord(maybeData)) return [];
  const maybeImages = maybeData.images;
  if (!Array.isArray(maybeImages)) return [];

  return maybeImages.filter(
    (item): item is MyImageItemResponseDto =>
      isRecord(item) && typeof item.id === "string" && typeof item.key === "string",
  );
}
