import Link from "next/link";
import { ArticleResponseDto } from "@rawfli/types";
import styles from "./ArticleHead.module.css";

type ArticleHeadProps = {
  article: ArticleResponseDto;
  boardId: number;
  boardName: string;
  formattedDate: string;
};

export default function ArticleHead({ article, boardId, boardName, formattedDate }: ArticleHeadProps) {
  return (
    <div className={styles.articleHead}>
      <Link href={`/boards/${boardId}`} className={styles.boardLabel}>{boardName}</Link>
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
