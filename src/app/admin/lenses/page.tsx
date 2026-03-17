"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminControllerGetUnverifiedLenses, useAdminControllerMergeLenses, LensResponseDto } from "@/lib/admin-api";
import { removeAdminToken } from "@/lib/admin-auth";
import { getApiErrorMessage, isUnauthorizedError } from "@/lib/api";
import styles from "../equipment-management.module.css";

export default function AdminLensesPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const limit = 20;

  const lensesQuery = useAdminControllerGetUnverifiedLenses({ page: String(page), limit: String(limit) });
  const mergeMutation = useAdminControllerMergeLenses();

  const items = (lensesQuery.data?.data.lenses ?? []) as LensResponseDto[];
  const total = lensesQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const selectedItems = items.filter((lens) => selectedIds.includes(lens.id));
  let errorMessage: string | null = null;

  if (lensesQuery.error && !isUnauthorizedError(lensesQuery.error)) {
    errorMessage = getApiErrorMessage(lensesQuery.error, "렌즈 목록을 불러오지 못했습니다.");
  } else if (mergeMutation.error && !isUnauthorizedError(mergeMutation.error)) {
    errorMessage = getApiErrorMessage(mergeMutation.error, "렌즈 병합에 실패했습니다.");
  }

  useEffect(() => {
    if (isUnauthorizedError(lensesQuery.error) || isUnauthorizedError(mergeMutation.error)) {
      removeAdminToken();
      router.replace("/admin");
    }
  }, [lensesQuery.error, mergeMutation.error, router]);

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
      setSuccessMessage(`렌즈 ${sourceIds.length}개를 병합했습니다.`);
      await lensesQuery.refetch();
    } catch {
      return;
    }
  };

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <h1>렌즈 관리</h1>
          <p className={styles.summary}>미검증 렌즈 {total}개, 선택 {selectedIds.length}개</p>
        </div>
        <button type="button" className={styles.mergeButton} onClick={openMergeModal} disabled={selectedIds.length < 2}>
          병합
        </button>
      </header>

      {lensesQuery.isLoading ? <p>로딩 중...</p> : null}
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
          {items.map((lens) => (
            <tr key={lens.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedSet.has(lens.id)}
                  onChange={(event) => {
                    setSelectedIds((prev) => {
                      if (event.target.checked) return [...prev, lens.id];
                      return prev.filter((id) => id !== lens.id);
                    });
                  }}
                />
              </td>
              <td>{lens.id}</td>
              <td>{lens.brand ?? "-"}</td>
              <td>{lens.modelName}</td>
              <td>
                {lens.aliases.length ? (
                  <div className={styles.aliasList}>
                    {lens.aliases.map((alias) => (
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
          {!items.length && !lensesQuery.isLoading ? (
            <tr>
              <td colSpan={5} className={styles.empty}>
                미검증 렌즈가 없습니다.
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
            <p>유지할 렌즈를 target으로 선택하세요. 나머지 선택 항목은 모두 이 렌즈로 합쳐집니다.</p>
            <p className={styles.modalNotice}>source 모델명/별칭은 target의 alias로 보존됩니다.</p>
            <div className={styles.targetList}>
              {selectedItems.map((lens) => (
                <label key={lens.id} className={styles.targetRow}>
                  <input
                    type="radio"
                    name="lens-target"
                    checked={targetId === lens.id}
                    onChange={() => setTargetId(lens.id)}
                  />
                  <div className={styles.targetInfo}>
                    <span className={styles.targetName}>
                      ID {lens.id} · {lens.brand ?? "Unknown"} {lens.modelName}
                    </span>
                    <span className={styles.targetAliases}>
                      {lens.aliases.map((alias) => alias.rawExifName).join(" / ") || "별칭 없음"}
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
