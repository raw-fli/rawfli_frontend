import Link from "next/link";
import {
  LightningBoltIcon,
  RocketIcon,
  ChatBubbleIcon,
  QuestionMarkCircledIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import styles from "./BoardPage.module.css";
import { ArticleListItemResponseDto, BoardResponseDto } from "@rawfli/types";

type BoardSidebarProps = {
  boards: BoardResponseDto[];
  currentBoardId: number;
  popularArticles: ArticleListItemResponseDto[];
};

const BOARD_ICONS: Record<string, React.ReactNode> = {
  자유게시판: <ChatBubbleIcon />,
  질문게시판: <QuestionMarkCircledIcon />,
  default: <ReaderIcon />,
};

function getBoardIcon(name: string) {
  return BOARD_ICONS[name] ?? BOARD_ICONS.default;
}

export default function BoardSidebar({ boards, currentBoardId, popularArticles }: BoardSidebarProps) {
  const communityBoards = boards.filter((b) => b.type === "community");

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarCard}>
        <h3 className={styles.sidebarTitle}>
          <LightningBoltIcon className={styles.sidebarTitleIcon} />
          인기 게시판
        </h3>
        <div className={styles.sidebarList}>
          {communityBoards.map((board, index) => (
            <Link
              key={board.id}
              href={`/boards/${board.id}`}
              className={`${styles.sidebarItem} ${board.id === currentBoardId ? styles.sidebarItemActive : ""}`}
            >
              <span className={styles.sidebarItemName}>
                <span className={styles.sidebarItemIcon}>{getBoardIcon(board.name)}</span>
                {board.name}
              </span>
              {index === 0 && <span className={styles.hotBadge}>HOT</span>}
            </Link>
          ))}
        </div>
      </div>

      {popularArticles.length > 0 && (
        <div className={styles.sidebarCard}>
          <h3 className={styles.sidebarTitle}>
            <RocketIcon className={styles.sidebarTitleIcon} />
            인기 게시글
          </h3>
          <div className={styles.popularList}>
            {popularArticles.slice(0, 5).map((article) => (
              <Link
                key={article.id}
                href={`/boards/${currentBoardId}/articles/${article.id}`}
                className={styles.popularItem}
              >
                <p className={styles.popularItemTitle}>{article.title}</p>
                <span className={styles.popularItemMeta}>
                  댓글 {article.commentCount} · 추천 {article.likesCount}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
