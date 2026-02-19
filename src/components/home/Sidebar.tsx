import Link from "next/link";
import { Pencil2Icon, LightningBoltIcon } from "@radix-ui/react-icons";
import type { Board } from "@/lib/types";
import styles from "./HomePage.module.css";

type SidebarProps = {
  boards: Board[];
};

export default function Sidebar({ boards }: SidebarProps) {
  const boardsList = boards.slice(0, 4);

  return (
    <aside className={styles.sidebar}>
      <button className={styles.sidebarButton} type="button">
        <Pencil2Icon /> 글쓰기
      </button>

      <div className={`${styles.sidebarCard} ${styles.sidebarPopularCard}`}>
        <h3 className={styles.sidebarTitle}>
          <LightningBoltIcon /> 게시판 목록
        </h3>
        <div className={styles.sidebarList}>
          {boardsList.map((board, index) => (
            <Link
              key={board.id}
              href={``}
              className={`${styles.sidebarItem} ${index === 0 ? styles.sidebarItemActive : ""}`}
            >
              <span>{board.name}</span>
              {index === 0 && <span className={styles.hotBadge}>HOT</span>}
            </Link>
          ))}
        </div>
      </div>
        
      {/* TODO: fix stats data */}
      <div className={`${styles.sidebarCard} ${styles.sidebarStatsCard}`}>
        <span className={styles.sidebarTitle}>커뮤니티 현황</span>
        <div className={styles.statsGrid}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>1,240</div>
            <div className={styles.statLabel}>오늘의 게시글</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>850</div>
            <div className={styles.statLabel}>접속 멤버</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
