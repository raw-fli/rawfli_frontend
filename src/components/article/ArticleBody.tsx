"use client";

import type { ArticleResponse } from "@/lib/types";
import Image from "next/image";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import styles from "./ArticleBody.module.css";

type ArticleBodyProps = {
  article: ArticleResponse;
  heroImageUrl?: string | null;
  boardId: number;
  articleId: number;
};

export default function ArticleBody({ article, heroImageUrl, boardId, articleId }: ArticleBodyProps) {
  const [likesCount, setLikesCount] = useState(article.likesCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (!isLoggedIn()) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      await api.post(`/api/v1/boards/${boardId}/articles/${articleId}/like`);
      setLiked((prev) => !prev);
      setLikesCount((prev) => liked ? prev - 1 : prev + 1);
    } catch (error) {
      if (error instanceof ApiError) alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.articleBody}>
      <p className={styles.content}>{article.content}</p>

      {heroImageUrl && (
        <div className={styles.imageWrap}>
          <Image
            className={styles.image}
            src={heroImageUrl}
            alt={article.title}
            width={1200}
            height={800}
            sizes="(max-width: 1024px) 100vw, 75vw"
            priority
          />
        </div>
      )}

      <div className={styles.recommendWrap}>
        <button
          type="button"
          className={`${styles.recommendButton} ${liked ? styles.recommendButtonActive : ""}`}
          onClick={handleLike}
          disabled={loading}
        >
          <strong>추천하기</strong>
          <span className={styles.likeCount}>{likesCount.toLocaleString()}</span>
        </button>
      </div>
    </div>
  );
}
