import type { ArticleListResponse, Board } from "@/lib/types";
import HomeHeader from "@/components/home/HomeHeader";
import Sidebar from "@/components/home/Sidebar";
import CommunitySection from "@/components/home/CommunitySection";
import HomeFooter from "@/components/home/HomeFooter";
import styles from "@/components/home/HomePage.module.css";
import { API_BASE_URL } from "@/shared/config/env";

type ApiResponse<T> = {
  result: boolean;
  code: number;
  data: T | string;
};

type BoardFeed = {
  board: Board;
  articles?: ArticleListResponse["articles"];
};

type ArticlePreviewDetail = {
  content?: string;
  thumbnailKey?: string;
};

async function fetchApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
    const json = (await res.json()) as ApiResponse<T>;

    if (!json.result) {
      return null;
    }

    return json.data as T;
  } catch {
    return null;
  }
}

async function loadBoardFeeds(): Promise<BoardFeed[]> {
  const boards = (await fetchApi<Board[]>("/api/v1/boards")) ?? [];

  const feeds = await Promise.all(
    boards.map(async (board) => {
      if (board.type === "gallery") {
        return { board };
      }

      const data = await fetchApi<ArticleListResponse>(
        `/api/v1/boards/${board.id}/articles?page=1&limit=6`
      );

      const articles = data?.articles ?? [];
      const featured = articles[0];

      if (!featured) {
        return { board, articles };
      }

      const needsDetail = !featured.content || !featured.thumbnailKey;
      if (!needsDetail) {
        return { board, articles };
      }

      const detail = await fetchApi<ArticlePreviewDetail>(
        `/api/v1/boards/${board.id}/articles/${featured.id}`
      );

      const mergedFeatured = {
        ...featured,
        content: detail?.content ?? featured.content,
        thumbnailKey: detail?.thumbnailKey ?? featured.thumbnailKey,
      };

      return {
        board,
        articles: [mergedFeatured, ...articles.slice(1)],
      };
    })
  );

  return feeds;
}

export default async function Home() {
  const feeds = await loadBoardFeeds();
  const communityBoards = feeds.filter((feed) => feed.board.type === "community");

  return (
    <div className={styles.page}>
      <HomeHeader />

      <main className={styles.main}>
        <div className={styles.grid}>
          <Sidebar boards={feeds.map((feed) => feed.board)} />

          <div className={styles.content}>
            <div id="community">
              {communityBoards.map((feed, index) => (
                <CommunitySection
                  key={feed.board.id}
                  board={feed.board}
                  articles={feed.articles ?? []}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
