"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminControllerGetImages, AdminImageResponseDto } from "@/lib/admin-api";
import { removeAdminToken } from "@/lib/admin-auth";
import { getApiErrorMessage, isUnauthorizedError } from "@/lib/api";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "../moderation-list.module.css";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR");
}

export default function AdminImagesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<AdminImageResponseDto | null>(null);
  const limit = 20;

  const imagesQuery = useAdminControllerGetImages({ page: String(page), limit: String(limit) });
  const items = (imagesQuery.data?.data.images ?? []) as AdminImageResponseDto[];
  const total = imagesQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  let errorMessage: string | null = null;
  if (imagesQuery.error && !isUnauthorizedError(imagesQuery.error)) {
    errorMessage = getApiErrorMessage(imagesQuery.error, "이미지 목록을 불러오지 못했습니다.");
  }

  useEffect(() => {
    if (isUnauthorizedError(imagesQuery.error)) {
      removeAdminToken();
      router.replace("/admin");
    }
  }, [imagesQuery.error, router]);

  useEffect(() => {
    if (!previewImage) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [previewImage]);

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <h1>업로드 이미지</h1>
          <p className={styles.summary}>총 {total}개</p>
        </div>
      </header>

      {imagesQuery.isLoading ? <p>로딩 중...</p> : null}
      {errorMessage ? <p className={`${styles.feedback} ${styles.feedbackError}`}>{errorMessage}</p> : null}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Image ID</th>
            <th>Key</th>
            <th>Uploader</th>
            <th>생성일</th>
          </tr>
        </thead>
        <tbody>
          {items.map((image) => (
            <tr key={image.id}>
              <td>{image.id}</td>
              <td className={styles.keyCell}>
                <button type="button" className={styles.inlineLinkButton} onClick={() => setPreviewImage(image)}>
                  {image.key}
                </button>
              </td>
              <td>
                #{image.uploaderId}{" "}
                <Link href={`/users/${image.uploaderId}`} className={styles.inlineTextLink}>
                  {image.uploaderUsername}
                </Link>
              </td>
              <td className={styles.dateCell}>{formatDateTime(image.createdAt)}</td>
            </tr>
          ))}
          {!items.length && !imagesQuery.isLoading ? (
            <tr>
              <td colSpan={4} className={styles.empty}>
                조회할 이미지가 없습니다.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
          이전
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages}
        >
          다음
        </button>
      </div>

      {previewImage ? (
        <div className={styles.modalBackdrop} onClick={() => setPreviewImage(null)}>
          <div className={styles.previewModal} onClick={(event) => event.stopPropagation()}>
            <header className={styles.previewHeader}>
              <h2>이미지 미리보기</h2>
              <button type="button" className={styles.modalCloseButton} onClick={() => setPreviewImage(null)}>
                닫기
              </button>
            </header>
            <p className={styles.previewMeta}>ID: {previewImage.id}</p>
            <p className={styles.previewMeta}>Key: {previewImage.key}</p>
            {toS3ImageUrl(previewImage.key) ? (
              <div className={styles.previewImageWrap}>
                <Image
                  src={toS3ImageUrl(previewImage.key) as string}
                  alt={previewImage.key}
                  width={960}
                  height={640}
                  className={styles.previewImage}
                  unoptimized
                />
              </div>
            ) : (
              <p className={`${styles.feedback} ${styles.feedbackError}`}>이미지 URL을 생성할 수 없습니다.</p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
