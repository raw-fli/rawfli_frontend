"use client";

import type { CommentResponse } from "@/lib/types";
import { useState } from "react";
import { formatRelativeTime } from "@/shared/utils/time";
import { api, ApiError } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import styles from "./CommentSection.module.css";

type CommentSectionProps = {
  comments: CommentResponse[];
  boardId: number;
  articleId: number;
};

function countAllComments(comments: CommentResponse[]): number {
  return comments.reduce(
    (sum, comment) => sum + 1 + countAllComments(comment.replies ?? []),
    0
  );
}

function CommentItem({ comment, depth = 0, parentAuthor }: { comment: CommentResponse; depth?: number; parentAuthor?: string }) {
  const replies = comment.replies ?? [];

  return (
    <>
      <article
        className={`${styles.commentItem} ${depth > 0 ? styles.replyItem : ""}`}
        style={depth > 0 ? { marginLeft: `${Math.min(depth, 3) * 24}px` } : undefined}
      >
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>
            {comment.author.username}
            {parentAuthor && (
              <span className={styles.replyIndicator}> → @{parentAuthor}</span>
            )}
          </span>
          <span className={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <p className={styles.commentText}>{comment.content}</p>
      </article>
      {replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} parentAuthor={comment.author.username} />
      ))}
    </>
  );
}

export default function CommentSection({ comments: initialComments, boardId, articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentResponse[]>(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const totalCount = countAllComments(comments);

  const handleSubmit = async () => {
    if (!isLoggedIn()) {
      alert("로그인이 필요합니다.");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const newComment = await api.post<CommentResponse>(
        `/api/v1/boards/${boardId}/articles/${articleId}/comments`,
        { content: trimmed }
      );
      setComments((prev) => [...prev, newComment]);
      setText("");
    } catch (error) {
      if (error instanceof ApiError) alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.commentCard}>
      <h2 className={styles.commentHead}>
        댓글 <span className={styles.commentHeadCount}>{totalCount}</span>
      </h2>

      {totalCount > 0 ? (
        <div className={styles.commentList}>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyComment}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요.</div>
      )}

      <div className={styles.commentWrite}>
        <textarea
          className={styles.commentInput}
          placeholder="매너 있는 댓글은 작성자에게 큰 힘이 됩니다."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={submitting}
        />
        <button
          className={styles.commentButton}
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
        >
          {submitting ? "저장 중..." : "등록"}
        </button>
      </div>
    </section>
  );
}
