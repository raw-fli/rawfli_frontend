import Link from "next/link";
import { PersonIcon } from "@radix-ui/react-icons";
import { formatRelativeTime } from "@/shared/utils/time";
import styles from "./HomePage.module.css";
import { PostListItemResponseDto, BoardResponseDto } from "@rawfli/types";

type GallerySectionProps = {
  board: BoardResponseDto;
  posts: PostListItemResponseDto[];
  index: number;
};

export default function GallerySection({ board, posts, index }: GallerySectionProps) {
  if (posts.length === 0) return null;

  return (
    <section id={`board-${board.id}`} className={styles.sectionCard} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <span>{board.name}</span>
        </div>
        <Link href={`/boards/${board.id}`} className={styles.sectionAction}>
          전체보기
        </Link>
      </div>

      <div className={styles.sectionBody}>
        {posts.slice(0, 5).map((post) => (
          <Link key={post.id} href={`/boards/${board.id}/posts/${post.id}`} className={styles.listRow}>
            <span className={styles.listIndex}>{post.id}</span>
            <span className={styles.listTitleWrap}>
              <span className={styles.listTitle}>{post.title}</span>
            </span>
            <span className={styles.listCommentMeta}>
              <PersonIcon style={{ width: 12, height: 12 }} />
              <span>{post.author.username}</span>
              <span className={styles.metaDivider}>·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
