import Link from "next/link";
import type { Board, PostListItem } from "@/lib/types";
import styles from "./HomePage.module.css";

type GallerySectionProps = {
  board: Board;
  posts: PostListItem[];
};

export default function GallerySection({ board, posts }: GallerySectionProps) {
  return (
    <section id="gallery" className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>{board.name}</div>
        <Link href="#" className={styles.sectionAction}>
          전체보기
        </Link>
      </div>
      <div className={styles.sectionBody}>
        <div className={styles.featuredRow}>
          <div className={styles.galleryHeader}>
            <span>실시간 갤러리</span>
            <div>
              <button className={styles.sectionAction} type="button">
                이전
              </button>
              <button className={styles.sectionAction} type="button">
                다음
              </button>
            </div>
          </div>
          <div className={styles.galleryGrid}>
            {posts.slice(0, 8).map((post) => (
              <Link
                key={post.id}
                href={`/boards/${board.id}/posts/${post.id}`}
                className={styles.galleryItem}
              >
                <span className={styles.galleryLabel}>{post.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
