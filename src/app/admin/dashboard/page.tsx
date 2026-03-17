"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminControllerGetUnverifiedCameras, useAdminControllerGetUnverifiedLenses } from "@/lib/admin-api";
import { removeAdminToken } from "@/lib/admin-auth";
import { getApiErrorMessage, isUnauthorizedError } from "@/lib/api";
import styles from "./dashboard-home.module.css";

export default function AdminDashboardPage() {
  const router = useRouter();

  const camerasQuery = useAdminControllerGetUnverifiedCameras({ page: "1", limit: "1" });
  const lensesQuery = useAdminControllerGetUnverifiedLenses({ page: "1", limit: "1" });

  useEffect(() => {
    if (isUnauthorizedError(camerasQuery.error) || isUnauthorizedError(lensesQuery.error)) {
      removeAdminToken();
      router.replace("/admin");
    }
  }, [camerasQuery.error, lensesQuery.error, router]);

  const isLoading = camerasQuery.isLoading || lensesQuery.isLoading;
  const cameraTotal = camerasQuery.data?.data.total ?? 0;
  const lensTotal = lensesQuery.data?.data.total ?? 0;
  let errorMessage: string | null = null;

  if (camerasQuery.error && !isUnauthorizedError(camerasQuery.error)) {
    errorMessage = getApiErrorMessage(camerasQuery.error, "카메라 통계를 불러오지 못했습니다.");
  } else if (lensesQuery.error && !isUnauthorizedError(lensesQuery.error)) {
    errorMessage = getApiErrorMessage(lensesQuery.error, "렌즈 통계를 불러오지 못했습니다.");
  }

  return (
    <section className={styles.wrap}>
      <h1 className={styles.title}>관리자 대시보드</h1>
      <p className={styles.subtitle}>미검증 장비를 검토하고 병합 작업을 진행하세요.</p>

      {errorMessage ? <p className={styles.error}>{errorMessage}</p> : null}

      <div className={styles.cards}>
        <Link href="/admin/cameras" className={styles.cardLink}>
          <article className={styles.card}>
          <h2>미검증 카메라</h2>
          <p className={styles.value}>{isLoading ? "..." : cameraTotal}</p>
          </article>
        </Link>
        <Link href="/admin/lenses" className={styles.cardLink}>
          <article className={styles.card}>
          <h2>미검증 렌즈</h2>
          <p className={styles.value}>{isLoading ? "..." : lensTotal}</p>
          </article>
        </Link>
      </div>
    </section>
  );
}
