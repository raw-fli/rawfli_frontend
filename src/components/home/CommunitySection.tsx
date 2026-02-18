import Link from "next/link";
import { ChatBubbleIcon, EyeOpenIcon, HeartIcon, ImageIcon, PersonIcon } from "@radix-ui/react-icons";
import type { ArticleListItem, Board } from "@/lib/types";
import { toS3ImageUrl } from "@/shared/utils/image";
import { formatRelativeTime } from "@/shared/utils/time";
import styles from "./HomePage.module.css";

type CommunitySectionProps = {
  board: Board;
  articles: ArticleListItem[];
  index: number;
};

export default function CommunitySection({ board, articles, index }: CommunitySectionProps) {
  const [featured, ...rest] = articles;
  const thumbnailUrl = toS3ImageUrl(featured?.thumbnailKey);

  return (
    <section id={`board-${board.id}`} className={styles.sectionCard} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <span>{board.name}</span>
        </div>
        <Link href="#" className={styles.sectionAction}>
          전체보기
        </Link>
      </div>

      <div className={styles.sectionBody}>
        {featured && (
          <div className={styles.featuredRow}>
            <Link href={`/boards/${board.id}/articles/${featured.id}`} className={styles.featuredCard}>
              <div
                className={styles.featuredMedia}
                style={
                  thumbnailUrl
                    ? {
                        backgroundImage: `url(${thumbnailUrl})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                      }
                    : undefined
                }
              />
              <div>
                <span className={styles.featuredBadge}>BEST</span>
                <div className={styles.featuredTitle}>{featured.title}</div>
                <p className={styles.featuredText}>{featured.content?.trim() || "본문이 없습니다."}</p>
                <div className={styles.metaRow}>
                  <span className={styles.metaInline}>
                    <span className={`${styles.metaIconItem} ${styles.metaLikeItem}`}>
                      <HeartIcon /> {featured.likesCount ?? 0}
                    </span>
                    <span className={styles.metaDivider}>·</span>
                    <span className={styles.metaIconItem}>
                      <PersonIcon /> {featured.author.username}
                    </span>
                    <span className={styles.metaDivider}>·</span>
                    <span className={styles.metaIconItem}>
                      <EyeOpenIcon /> {featured.views}
                    </span>
                    <span className={styles.metaDivider}>·</span>
                    <span className={styles.metaIconItem}>
                      <ChatBubbleIcon /> {featured.commentCount}
                    </span>
                  </span>
                  <span className={styles.metaTime}>{formatRelativeTime(featured.createdAt)}</span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {rest.slice(0, 4).map((item) => (
          <Link key={item.id} href={`/boards/${board.id}/articles/${item.id}`} className={styles.listRow}>
            <span className={styles.listIndex}>{item.id}</span>
            <span className={styles.listTitleWrap}>
              {item.thumbnailKey ? (
                <ImageIcon className={styles.listThumbIcon} aria-label="이미지 포함" />
              ) : (
                <ChatBubbleIcon className={styles.listFallbackIcon} aria-label="이미지 없음" />
              )}
              <span className={styles.listTitle}>{item.title}</span>
              {item.commentCount > 0 && (
                <span className={styles.listCommentCount}>[{item.commentCount}]</span>
              )}
            </span>
            <span className={styles.listCommentMeta}>
              <span>{item.author.username}</span>
              <span className={styles.metaDivider}>·</span>
              <HeartIcon className={styles.listCommentIcon} />
              {item.likesCount ?? 0}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
