"use client";

import Image from "next/image";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ApiError } from "@/lib/api";
import { isLoggedIn } from "@/lib/auth";
import styles from "./ArticleBody.module.css";
import { articleControllerToggleLike, ArticleResponseDto } from "@rawfli/types";

type ArticleBodyProps = {
  article: ArticleResponseDto;
  imageUrls: (string | undefined)[];
  boardId: number;
  articleId: number;
};

export default function ArticleBody({ article, imageUrls, boardId, articleId }: ArticleBodyProps) {
  const [likesCount, setLikesCount] = useState(article.likesCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  const imageIdMap = Object.fromEntries(
    article.attachedImages.map((img) => [img.id, imageUrls.find((u) => u?.includes(encodeURI(img.key)))])
  );

  const hasInlineImages = /!\[\]\([^)]+\)/.test(article.content);

  const handleLike = async () => {
    if (!isLoggedIn()) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      await articleControllerToggleLike(boardId, articleId);
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
      {hasInlineImages ? (
        <div className={styles.content}>
          <ReactMarkdown
            components={{
              img: ({ src }: any) => {
                const url = imageIdMap[src] ?? src;
                if (!url) return null;
                return (
                  <span className={styles.imageWrap}>
                    <Image
                      className={styles.image}
                      src={url}
                      alt=""
                      width={1200}
                      height={800}
                      sizes="(max-width: 1024px) 100vw, 75vw"
                    />
                  </span>
                );
              },
              p: ({ children }) => <p style={{ margin: "0 0 1em" }}>{children}</p>,
            }}
          >
            {article.content}
          </ReactMarkdown>
        </div>
      ) : (
        <>
          <p className={styles.content}>{article.content}</p>

          {imageUrls.filter(Boolean).length > 0 && (
            <div className={styles.imageList}>
              {imageUrls.filter((url): url is string => !!url).map((url) => (
                <div key={url} className={styles.imageWrap}>
                  <Image
                    className={styles.image}
                    src={url}
                    alt={article.title}
                    width={1200}
                    height={800}
                    sizes="(max-width: 1024px) 100vw, 75vw"
                  />
                </div>
              ))}
            </div>
          )}
        </>
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

