import Link from "next/link";
import { ArticleResponseDto } from "@rawfli/types";
import styles from "./ArticleHead.module.css";
import { toS3ImageUrl } from "@/shared/utils/image";
import { PersonIcon } from "@radix-ui/react-icons";

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
        <Link href={`/users/${article.author.id}`} className={styles.metaStrong}>
          <span className={styles.authorAvatar}>
            {article.author.profileImageKey ? (
              <img
                src={toS3ImageUrl(article.author.profileImageKey)}
                alt={article.author.username}
                className={styles.authorAvatarImg}
              />
            ) : (
              <PersonIcon className={styles.authorAvatarIcon} />
            )}
          </span>
          {article.author.username}
        </Link>
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
