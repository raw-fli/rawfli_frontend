import Link from "next/link";
import { PersonIcon } from "@radix-ui/react-icons";
import { toS3ImageUrl } from "@/shared/utils/image";
import { formatRelativeTime } from "@/shared/utils/time";
import styles from "./HomePage.module.css";
import { PostListItemResponseDto } from "@rawfli/types";

type PostSectionProps = {
  posts: PostListItemResponseDto[];
  index: number;
};

export default function PostSection({ posts, index }: PostSectionProps) {
  if (posts.length === 0) return null;

  return (
    <section id="posts" className={styles.sectionCard} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <span>인기 포스트</span>
        </div>
        <Link href="/posts" className={styles.sectionAction}>
          전체보기
        </Link>
      </div>

      <div className={styles.sectionBody}>
        <div className={styles.postPreviewGrid}>
          {posts.slice(0, 3).map((post) => {
            const thumbnailUrl = post.thumbnailKey ? toS3ImageUrl(post.thumbnailKey) : "";
            const profileImageUrl = post.author.profileImageKey
              ? toS3ImageUrl(post.author.profileImageKey)
              : "";

            return (
              <Link key={post.id} href={`/posts/${post.id}`} className={styles.postPreviewCard}>
                <div className={styles.postPreviewThumbWrap}>
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={post.title} className={styles.postPreviewThumb} />
                  ) : (
                    <div className={styles.postPreviewThumbPlaceholder}>대표 이미지 없음</div>
                  )}
                  <span className={styles.postPreviewBadge}>작품 {post.photoCount}</span>
                </div>

                <div className={styles.postPreviewBody}>
                  <h4 className={styles.postPreviewTitle}>{post.title}</h4>
                  <div className={styles.postPreviewMeta}>
                    <span className={styles.postPreviewAuthor}>
                      <span className={styles.postPreviewAvatar}>
                        {profileImageUrl ? (
                          <img
                            src={profileImageUrl}
                            alt={post.author.username}
                            className={styles.postPreviewAvatarImage}
                          />
                        ) : (
                          <PersonIcon className={styles.listCommentIcon} />
                        )}
                      </span>
                      {post.author.username}
                    </span>
                    <span className={styles.metaDivider}>·</span>
                    <span>{formatRelativeTime(post.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
