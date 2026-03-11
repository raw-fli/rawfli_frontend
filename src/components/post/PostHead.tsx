import Link from "next/link";
import { PostResponseDto } from "@rawfli/types";
import styles from "../article/ArticleHead.module.css";

type PostHeadProps = {
  post: PostResponseDto;
  boardId: number;
  boardName: string;
  formattedDate: string;
};

export default function PostHead({ post, boardId, boardName, formattedDate }: PostHeadProps) {
  return (
    <div className={styles.articleHead}>
      <Link href={`/boards/${boardId}`} className={styles.boardLabel}>{boardName}</Link>
      <h1 className={styles.title}>{post.title}</h1>

      <div className={styles.metaRow}>
        <span className={styles.metaStrong}>{post.author.username}</span>
        <span className={styles.metaDivider}>·</span>
        <span>{formattedDate}</span>
      </div>
    </div>
  );
}
