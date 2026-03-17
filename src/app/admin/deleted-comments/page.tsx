"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminControllerGetDeletedComments, DeletedCommentResponseDto } from "@/lib/admin-api";
import { removeAdminToken } from "@/lib/admin-auth";
import { getApiErrorMessage, isUnauthorizedError } from "@/lib/api";
import styles from "../moderation-list.module.css";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR");
}

export default function AdminDeletedCommentsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 20;

  const commentsQuery = useAdminControllerGetDeletedComments({ page: String(page), limit: String(limit) });
  const items = (commentsQuery.data?.data.comments ?? []) as DeletedCommentResponseDto[];
  const total = commentsQuery.data?.data.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  let errorMessage: string | null = null;
  if (commentsQuery.error && !isUnauthorizedError(commentsQuery.error)) {
    errorMessage = getApiErrorMessage(commentsQuery.error, "삭제 댓글 목록을 불러오지 못했습니다.");
  }

  useEffect(() => {
    if (isUnauthorizedError(commentsQuery.error)) {
      removeAdminToken();
      router.replace("/admin");
    }
  }, [commentsQuery.error, router]);

  return (
    <section className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <h1>삭제 댓글</h1>
          <p className={styles.summary}>총 {total}개</p>
        </div>
      </header>

      {commentsQuery.isLoading ? <p>로딩 중...</p> : null}
      {errorMessage ? <p className={`${styles.feedback} ${styles.feedbackError}`}>{errorMessage}</p> : null}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Post</th>
            <th>Board</th>
            <th>Author</th>
            <th>내용</th>
            <th>삭제일</th>
          </tr>
        </thead>
        <tbody>
          {items.map((comment) => (
            <tr key={comment.id}>
              <td>{comment.originalCommentId}</td>
              <td>{comment.postId}</td>
              <td>{comment.boardId}</td>
              <td>{comment.authorId}</td>
              <td className={styles.contentCell}>{comment.content}</td>
              <td className={styles.dateCell}>{formatDateTime(comment.deletedAt)}</td>
            </tr>
          ))}
          {!items.length && !commentsQuery.isLoading ? (
            <tr>
              <td colSpan={6} className={styles.empty}>
                삭제 댓글이 없습니다.
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
    </section>
  );
}
