import type { ArticleListResponse, Board } from "@/lib/types";
import HomeHeader from "@/components/home/HomeHeader";
import Sidebar from "@/components/home/Sidebar";
import CommunitySection from "@/components/home/CommunitySection";
import HomeFooter from "@/components/home/HomeFooter";
import styles from "@/components/home/HomePage.module.css";
import { fetchPublicApi } from "@/lib/publicApi";

type BoardFeed = {
  board: Board;
  articles?: ArticleListResponse["articles"];
};

type ArticlePreviewSummary = {
  content?: string;
  thumbnailKey?: string;
};

async function loadBoardFeeds(): Promise<BoardFeed[]> {
  const boards = (await fetchPublicApi<Board[]>("/api/v1/boards", { revalidate: 30 })) ?? [];

  const feeds = await Promise.all(
    boards.map(async (board) => {
      if (board.type === "gallery") {
        return { board };
      }

      const data = await fetchPublicApi<ArticleListResponse>(
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

      const detail = await fetchPublicApi<ArticlePreviewSummary>(
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
