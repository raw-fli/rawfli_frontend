import Link from "next/link";
import { PostListItemResponseDto } from "@rawfli/types";
import { formatRelativeTime } from "@/shared/utils/time";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "./BoardPage.module.css";

type GalleryPostGridProps = {
  boardId: number;
  boardName: string;
  posts: PostListItemResponseDto[];
};

type PostWithPhotoCount = PostListItemResponseDto & {
  photoCount?: number;
  thumbnailKey?: string | null;
};

function getAuthorBadge(username: string) {
  const label = username.trim();
  if (!label) return "?";
  return label.slice(0, 1).toUpperCase();
}

function getPhotoCount(post: PostListItemResponseDto) {
  return (post as PostWithPhotoCount).photoCount ?? 0;
}

function getThumbnailUrl(post: PostListItemResponseDto) {
  const thumbnailKey = (post as PostWithPhotoCount).thumbnailKey;
  if (!thumbnailKey) return "";
  return toS3ImageUrl(thumbnailKey);
}

function getAuthorProfileImageUrl(post: PostListItemResponseDto) {
  const profileImageKey = post.author.profileImageKey;
  if (!profileImageKey) return "";
  return toS3ImageUrl(profileImageKey);
}

export default function GalleryPostGrid({ boardId, boardName, posts }: GalleryPostGridProps) {
  return (
    <section className={styles.gallerySection}>
      <div className={styles.galleryHero}>
        <p className={styles.galleryHeroLabel}>Gallery Board</p>
        <h3 className={styles.galleryHeroTitle}>{boardName} 포스트</h3>
        <p className={styles.galleryHeroDescription}>
          최신 작품 포스트를 카드 뷰로 빠르게 탐색하세요.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className={styles.emptyState}>포스트가 없습니다.</div>
      ) : (
        <div className={styles.galleryGrid}>
          {posts.map((post) => {
            const thumbnailUrl = getThumbnailUrl(post);
            const authorProfileImageUrl = getAuthorProfileImageUrl(post);

            return (
            <Link
              key={post.id}
              href={`/boards/${boardId}/posts/${post.id}`}
              className={styles.galleryCard}
            >
              <div className={styles.galleryThumb}>
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={post.title}
                    className={styles.galleryThumbImage}
                  />
                ) : (
                  <>
                    <div className={styles.galleryThumbGlow} />
                    <div className={styles.galleryThumbHint}>대표 이미지 연동 예정</div>
                  </>
                )}
                <span className={styles.galleryThumbBadge}>작품 {getPhotoCount(post)}개</span>
              </div>

              <div className={styles.galleryBody}>
                <h4 className={styles.galleryTitle}>{post.title}</h4>

                <div className={styles.galleryMetaRow}>
                  <div className={styles.galleryAuthor}>
                    <div className={styles.galleryAuthorBadge}>
                      {authorProfileImageUrl ? (
                        <img
                          src={authorProfileImageUrl}
                          alt={post.author.username}
                          className={styles.galleryAuthorAvatarImage}
                        />
                      ) : (
                        getAuthorBadge(post.author.username)
                      )}
                    </div>
                    <span className={styles.galleryAuthorName}>{post.author.username}</span>
                  </div>
                  <span className={styles.galleryDate}>{formatRelativeTime(post.createdAt)}</span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}