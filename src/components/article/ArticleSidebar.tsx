import Link from "next/link";
import styles from "./ArticleSidebar.module.css";

type TrendingItem = {
  id: number;
  boardId: number;
  category: string;
  title: string;
};

type ArticleSidebarProps = {
  trending: TrendingItem[];
  todayPosts: number;
};

export default function ArticleSidebar({ trending, todayPosts }: ArticleSidebarProps) {
  return (
    <aside className={styles.sideCol}>
      <section className={styles.sideCard}>
        <h3 className={styles.sideTitle}>인기 게시글</h3>
        {trending.length > 0 ? (
          <ul className={styles.trendingList}>
            {trending.map((item) => (
              <li key={item.id} className={styles.trendingItem}>
                <Link href={`/boards/${item.boardId}/articles/${item.id}`} className={styles.trendingLink}>
                  <div className={styles.trendingCategory}>{item.category}</div>
                  <div className={styles.trendingTitle}>{item.title}</div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.trendingEmpty}>아직 인기 게시글이 없습니다.</p>
        )}
      </section>

      <section className={styles.sideCard}>
        <h3 className={styles.sideTitle}>커뮤니티 현황</h3>
        <div className={styles.statusGrid}>
          <div className={styles.statusBox}>
            <div className={styles.statusNumber}>{todayPosts.toLocaleString()}</div>
            <div className={styles.statusLabel}>오늘의 게시글</div>
          </div>
          <div className={styles.statusBox}>
            <div className={styles.statusNumber}>-</div>
            <div className={styles.statusLabel}>접속 멤버</div>
          </div>
        </div>
      </section>
    </aside>
  );
}
