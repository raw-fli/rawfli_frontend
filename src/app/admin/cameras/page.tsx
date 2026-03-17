"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminControllerGetUnverifiedCameras, useAdminControllerMergeCameras, CameraResponseDto } from "@/lib/admin-api";
import { removeAdminToken } from "@/lib/admin-auth";
import { getApiErrorMessage, isUnauthorizedError } from "@/lib/api";
import styles from "../equipment-management.module.css";

export default function AdminCamerasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const limit = 20;

  const camerasQuery = useAdminControllerGetUnverifiedCameras({ page: String(page), limit: String(limit) });
  const mergeMutation = useAdminControllerMergeCameras();

  const items = (camerasQuery.data?.data.cameras ?? []) as CameraResponseDto[];
  const total = camerasQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const selectedItems = items.filter((camera) => selectedIds.includes(camera.id));
  let errorMessage: string | null = null;

  if (camerasQuery.error && !isUnauthorizedError(camerasQuery.error)) {
    errorMessage = getApiErrorMessage(camerasQuery.error, "카메라 목록을 불러오지 못했습니다.");
  } else if (mergeMutation.error && !isUnauthorizedError(mergeMutation.error)) {
    errorMessage = getApiErrorMessage(mergeMutation.error, "카메라 병합에 실패했습니다.");
  }

  useEffect(() => {
    if (isUnauthorizedError(camerasQuery.error) || isUnauthorizedError(mergeMutation.error)) {
      removeAdminToken();
      router.replace("/admin");
    }
  }, [camerasQuery.error, mergeMutation.error, router]);

  const changePage = (nextPage: number) => {
    setPage(nextPage);
    setSelectedIds([]);
    setTargetId(null);
    setSuccessMessage(null);
  };

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const openMergeModal = () => {
    if (selectedIds.length < 2) {
      return;
    }
    setTargetId(selectedIds[0]);
    setIsModalOpen(true);
  };

  const onMerge = async () => {
    if (!targetId) return;
    const sourceIds = [...new Set(selectedIds.filter((id) => id !== targetId))];
    if (sourceIds.length === 0) return;

    try {
      await mergeMutation.mutateAsync({
        data: {
          targetId,
          sourceIds,
        },
      });

      setIsModalOpen(false);
      setSelectedIds([]);
      setTargetId(null);
      setSuccessMessage(`카메라 ${sourceIds.length}개를 병합했습니다.`);
      await camerasQuery.refetch();
    } catch {
      return;
    }
  };

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <h1>카메라 관리</h1>
          <p className={styles.summary}>미검증 카메라 {total}개, 선택 {selectedIds.length}개</p>
        </div>
        <button type="button" className={styles.mergeButton} onClick={openMergeModal} disabled={selectedIds.length < 2}>
          병합
        </button>
      </header>

      {camerasQuery.isLoading ? <p>로딩 중...</p> : null}
      {errorMessage ? <p className={`${styles.feedback} ${styles.feedbackError}`}>{errorMessage}</p> : null}
      {successMessage ? <p className={`${styles.feedback} ${styles.feedbackSuccess}`}>{successMessage}</p> : null}

      <table className={styles.table}>
        <thead>
          <tr>
            <th></th>
            <th>ID</th>
            <th>Brand</th>
            <th>Model Name</th>
            <th>Aliases</th>
          </tr>
        </thead>
        <tbody>
          {items.map((camera) => (
            <tr key={camera.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedSet.has(camera.id)}
                  onChange={(event) => {
                    setSelectedIds((prev) => {
                      if (event.target.checked) return [...prev, camera.id];
                      return prev.filter((id) => id !== camera.id);
                    });
                  }}
                />
              </td>
              <td>{camera.id}</td>
              <td>{camera.brand ?? "-"}</td>
              <td>{camera.modelName}</td>
              <td>
                {camera.aliases.length ? (
                  <div className={styles.aliasList}>
                    {camera.aliases.map((alias) => (
                      <span key={alias.id} className={styles.aliasChip}>
                        {alias.rawExifName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className={styles.aliasEmpty}>별칭 없음</span>
                )}
              </td>
            </tr>
          ))}
          {!items.length && !camerasQuery.isLoading ? (
            <tr>
              <td colSpan={5} className={styles.empty}>
                미검증 카메라가 없습니다.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className={styles.pagination}>
        <button type="button" onClick={() => changePage(Math.max(1, page - 1))} disabled={page <= 1}>
          이전
        </button>
        <span>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => changePage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          다음
        </button>
      </div>

      {isModalOpen ? (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2>병합 대상 선택</h2>
            <p>유지할 카메라를 target으로 선택하세요. 나머지 선택 항목은 모두 이 카메라로 합쳐집니다.</p>
            <p className={styles.modalNotice}>source 모델명/별칭은 target의 alias로 보존됩니다.</p>
            <div className={styles.targetList}>
              {selectedItems.map((camera) => (
                <label key={camera.id} className={styles.targetRow}>
                  <input
                    type="radio"
                    name="camera-target"
                    checked={targetId === camera.id}
                    onChange={() => setTargetId(camera.id)}
                  />
                  <div className={styles.targetInfo}>
                    <span className={styles.targetName}>
                      ID {camera.id} · {camera.brand ?? "Unknown"} {camera.modelName}
                    </span>
                    <span className={styles.targetAliases}>
                      {camera.aliases.map((alias) => alias.rawExifName).join(" / ") || "별칭 없음"}
                    </span>
                  </div>
                </label>
              ))}
            </div>
            <div className={styles.modalButtons}>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                취소
              </button>
              <button type="button" onClick={onMerge} disabled={mergeMutation.isPending || !targetId || selectedIds.length < 2}>
                {mergeMutation.isPending ? "병합 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
