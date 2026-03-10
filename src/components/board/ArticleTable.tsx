import Link from "next/link";
import { ImageIcon } from "@radix-ui/react-icons";
import { formatRelativeTime } from "@/shared/utils/time";
import styles from "./BoardPage.module.css";
import { ArticleListItemResponseDto } from "@rawfli/types";

type ArticleTableProps = {
  boardId: number;
  articles: ArticleListItemResponseDto[];
};

function formatViews(views: number): string {
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}k`;
  }
  return String(views);
}

export default function ArticleTable({ boardId, articles }: ArticleTableProps) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <div className={styles.tableHeaderCenter}>번호</div>
        <div>제목</div>
        <div>작성자</div>
        <div className={`${styles.tableHeaderCenter} ${styles.tableHeaderDate}`}>날짜</div>
        <div className={`${styles.tableHeaderCenter} ${styles.tableHeaderViews}`}>조회</div>
        <div className={`${styles.tableHeaderCenter} ${styles.tableHeaderLikes}`}>추천</div>
      </div>

      <div className={styles.tableBody}>
        {articles.length === 0 ? (
          <div className={styles.emptyState}>게시글이 없습니다.</div>
        ) : (
          articles.map((article) => (
            <Link
              key={article.id}
              href={`/boards/${boardId}/articles/${article.id}`}
              className={styles.tableRow}
            >
              <div className={styles.tableId}>{article.id}</div>

              <div className={styles.tableTitleWrap}>
                <span className={styles.tableTitle}>{article.title}</span>
                {article.thumbnailKey && (
                  <ImageIcon className={styles.tableThumbIcon} />
                )}
                {article.commentCount > 0 && (
                  <span className={styles.tableCommentCount}>
                    [{article.commentCount}]
                  </span>
                )}
              </div>

              <div className={styles.tableAuthor}>
                <span className={styles.tableAuthorName}>
                  {article.author.username}
                </span>
              </div>

              <div className={`${styles.tableDate} ${styles.tableHeaderDate}`}>
                {formatRelativeTime(article.createdAt)}
              </div>
              <div className={`${styles.tableViews} ${styles.tableHeaderViews}`}>
                {formatViews(article.views)}
              </div>
              <div className={`${styles.tableLikes} ${styles.tableHeaderLikes}`}>
                {article.likesCount}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
