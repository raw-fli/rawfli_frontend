import Link from "next/link";
import { Pencil2Icon, LightningBoltIcon } from "@radix-ui/react-icons";
import styles from "./HomePage.module.css";
import { BoardResponseDto } from "@rawfli/types";

type SidebarProps = {
  boards: BoardResponseDto[];
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
    </aside>
  );
}
