import Link from "next/link";
import { ChatBubbleIcon, ImageIcon, PersonIcon } from "@radix-ui/react-icons";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "./BoardPage.module.css";
import { ArticleListItemResponseDto } from "@rawfli/types";

type PopularArticleCardsProps = {
  boardId: number;
  articles: ArticleListItemResponseDto[];
};

const AVATAR_COLORS = ["#32ff00", "#6366f1", "#f97316", "#ec4899", "#06b6d4"];

export default function PopularArticleCards({ boardId, articles }: PopularArticleCardsProps) {
  if (articles.length === 0) return null;

  return (
    <section className={styles.bestCards}>
      {articles.slice(0, 3).map((article, index) => {
        const thumbnailUrl = toS3ImageUrl(article.thumbnailKey ?? "");
        const avatarUrl = article.author.profileImageKey
          ? toS3ImageUrl(article.author.profileImageKey)
          : null;
        const initial = article.author.username?.charAt(0).toUpperCase() ?? "?";
        const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

        return (
          <div
            key={article.id}
            className={styles.bestCard}
          >
            <Link href={`/boards/${boardId}/articles/${article.id}`} className={styles.bestCardImageWrap}>
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={article.title}
                  className={styles.bestCardImage}
                />
              ) : (
                <div className={styles.bestCardImagePlaceholder}>
                  <ImageIcon style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 32, height: 32, color: "var(--text-muted)", opacity: 0.4 }} />
                </div>
              )}
              <div className={styles.bestCardBadge}>BEST {index + 1}</div>
            </Link>

            <div className={styles.bestCardBody}>
              <Link href={`/boards/${boardId}/articles/${article.id}`} className={styles.bestCardTitle}>
                {article.title}
              </Link>
              <div className={styles.bestCardMeta}>
                <div className={styles.bestCardAuthor}>
                  <div
                    className={styles.bestCardAvatar}
                    style={avatarUrl ? undefined : { backgroundColor: avatarColor }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={article.author.username} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "9999px" }} />
                    ) : initial}
                  </div>
                  <Link href={`/users/${article.author.id}`} className={styles.bestCardAuthorName}>
                    {article.author.username}
                  </Link>
                </div>
                <div className={styles.bestCardComments}>
                  <ChatBubbleIcon />
                  <span className={styles.bestCardCommentCount}>
                    {article.commentCount}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
