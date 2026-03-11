import Link from "next/link";
import { formatRelativeTime } from "@/shared/utils/time";
import styles from "./BoardPage.module.css";
import { PostListItemResponseDto } from "@rawfli/types";

type PostTableProps = {
  boardId: number;
  posts: PostListItemResponseDto[];
};

export default function PostTable({ boardId, posts }: PostTableProps) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <div className={styles.tableHeaderCenter}>번호</div>
        <div>제목</div>
        <div>작성자</div>
        <div className={`${styles.tableHeaderCenter} ${styles.tableHeaderDate}`}>날짜</div>
      </div>

      <div className={styles.tableBody}>
        {posts.length === 0 ? (
          <div className={styles.emptyState}>포스트가 없습니다.</div>
        ) : (
          posts.map((post) => (
            <Link
              key={post.id}
              href={`/boards/${boardId}/posts/${post.id}`}
              className={styles.tableRow}
            >
              <div className={styles.tableId}>{post.id}</div>

              <div className={styles.tableTitleWrap}>
                <span className={styles.tableTitle}>{post.title}</span>
              </div>

              <div className={styles.tableAuthor}>
                <span className={styles.tableAuthorName}>
                  {post.author.username}
                </span>
              </div>

              <div className={`${styles.tableDate} ${styles.tableHeaderDate}`}>
                {formatRelativeTime(post.createdAt)}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
