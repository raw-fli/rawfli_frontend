import Link from "next/link";
import { PostListItemResponseDto } from "@rawfli/types";
import { formatRelativeTime } from "@/shared/utils/time";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "./PostGrid.module.css";

type PostGridProps = {
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

export default function PostGrid({ posts }: PostGridProps) {
  return (
    posts.length === 0 ? (
      <div className={styles.emptyState}>포스트가 없습니다.</div>
    ) : (
      <div className={styles.postGrid}>
        {posts.map((post) => {
          const thumbnailUrl = getThumbnailUrl(post);
          const authorProfileImageUrl = getAuthorProfileImageUrl(post);

          return (
            <Link key={post.id} href={`/posts/${post.id}`} className={styles.postCard}>
              <div className={styles.postThumb}>
                {thumbnailUrl ? (
                  <img src={thumbnailUrl} alt={post.title} className={styles.postThumbImage} />
                ) : (
                  <>
                    <div className={styles.postThumbGlow} />
                    <div className={styles.postThumbHint}>대표 이미지 연동 예정</div>
                  </>
                )}
                <span className={styles.postThumbBadge}>작품 {getPhotoCount(post)}개</span>
              </div>

              <div className={styles.postBody}>
                <h4 className={styles.postTitle}>{post.title}</h4>

                <div className={styles.postMetaRow}>
                  <div className={styles.postAuthor}>
                    <div className={styles.postAuthorBadge}>
                      {authorProfileImageUrl ? (
                        <img
                          src={authorProfileImageUrl}
                          alt={post.author.username}
                          className={styles.postAuthorAvatarImage}
                        />
                      ) : (
                        getAuthorBadge(post.author.username)
                      )}
                    </div>
                    <span className={styles.postAuthorName}>{post.author.username}</span>
                  </div>
                  <span className={styles.postDate}>{formatRelativeTime(post.createdAt)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    )
  );
}
