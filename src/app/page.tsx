import HomeHeader from "@/components/home/HomeHeader";
import Sidebar from "@/components/home/Sidebar";
import CommunitySection from "@/components/home/CommunitySection";
import GallerySection from "@/components/home/GallerySection";
import HomeFooter from "@/components/home/HomeFooter";
import styles from "@/components/home/HomePage.module.css";
import "@/lib/server-api";
import {
  articleControllerGetArticle,
  articleControllerGetArticles,
  articleControllerGetPopularArticles,
  ArticleListItemResponseDto,
  ArticleListResponseDto,
  BoardResponseDto,
  boardsControllerGetBoards,
  postsControllerGetPosts,
  PostListItemResponseDto,
} from "@rawfli/types";

type BoardFeed = {
  board: BoardResponseDto;
  articles?: ArticleListResponseDto["articles"] | ArticleListItemResponseDto[];
  posts?: PostListItemResponseDto[];
};

async function loadBoardFeeds(): Promise<BoardFeed[]> {
  const boardsResponse = await boardsControllerGetBoards();
  const boards = boardsResponse?.data ?? [];

  const getArticles = (
    data: ArticleListResponseDto): ArticleListResponseDto["articles"] => {
    if (!data) {
      return [];
    }

    if (Array.isArray(data)) {
      return data;
    }

    return data.articles ?? [];
  };

  const feeds = await Promise.all(
    boards.map(async (board) => {
      if (board.type === "gallery") {
        const postsData = await postsControllerGetPosts(board.id, { page: 1, limit: 5 });
        const posts: PostListItemResponseDto[] = postsData?.data?.posts ?? [];
        return { board, posts };
      }

      const latestData = await articleControllerGetArticles(board.id, { page: 1, limit: 6 });
      const popularData = await articleControllerGetPopularArticles(board.id, { page: 1, limit: 6 });

      const latestArticles = getArticles(latestData?.data)
      const popularArticles = getArticles(popularData?.data)
      const featured = popularArticles[0];

      if (!featured) {
        return { board, articles: latestArticles };
      }

      const needsDetail = !featured.thumbnailKey;
      const latestWithoutFeatured = latestArticles.filter((article) => article.id !== featured.id);

      if (!needsDetail) {
        return {
          board,
          articles: [featured, ...latestWithoutFeatured],
        };
      }

      const detailResponse = await articleControllerGetArticle(board.id, featured.id);
      const detail = detailResponse?.data;

      const mergedFeatured = {
        ...featured,
        content: detail?.content,
        thumbnailKey: featured.thumbnailKey,
      };

      return {
        board,
        articles: [mergedFeatured, ...latestWithoutFeatured],
      };
    })
  );

  return feeds;
}

export default async function Home() {
  const feeds = await loadBoardFeeds();
  const communityBoards = feeds.filter((feed) => feed.board.type === "community");
  const galleryBoards = feeds.filter((feed) => feed.board.type === "gallery");

  return (
    <div className={styles.page}>
      <HomeHeader />

      <main className={styles.main}>
        <div className={styles.grid}>
          <Sidebar boards={communityBoards.map((feed) => feed.board)} />

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

            <div id="gallery">
              {galleryBoards.map((feed, index) => (
                <GallerySection
                  key={feed.board.id}
                  board={feed.board}
                  posts={feed.posts ?? []}
                  index={communityBoards.length + index}
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
