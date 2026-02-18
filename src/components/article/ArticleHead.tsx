import type { ArticleResponse } from "@/lib/types";
import styles from "./ArticleHead.module.css";

type ArticleHeadProps = {
  article: ArticleResponse;
  boardName: string;
  formattedDate: string;
};

export default function ArticleHead({ article, boardName, formattedDate }: ArticleHeadProps) {
  return (
    <div className={styles.articleHead}>
      <span className={styles.boardLabel}>{boardName}</span>
      <h1 className={styles.title}>{article.title}</h1>

      <div className={styles.metaRow}>
        <span className={styles.metaStrong}>{article.author.username}</span>
        <span className={styles.metaDivider}>·</span>
        <span>{formattedDate}</span>
        <span className={styles.metaDivider}>·</span>
        <span>조회 {article.views.toLocaleString()}</span>
        <span className={styles.metaDivider}>·</span>
        <span className={styles.likeCount}>추천 {article.likesCount.toLocaleString()}</span>
      </div>
    </div>
  );
}
