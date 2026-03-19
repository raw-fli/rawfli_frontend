import { notFound } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import BoardSidebar from "@/components/board/BoardSidebar";
import PopularArticleCards from "@/components/board/PopularArticleCards";
import ArticleTable from "@/components/board/ArticleTable";
import GalleryPostGrid from "@/components/board/GalleryPostGrid";
import Pagination from "@/components/board/Pagination";
import Link from "next/link";
import { Pencil2Icon } from "@radix-ui/react-icons";
import "@/lib/server-api";
import styles from "@/components/board/BoardPage.module.css";
import {
  articleControllerGetArticles,
  articleControllerGetPopularArticles,
  ArticleListResponseDto,
  boardsControllerGetBoard,
  boardsControllerGetBoards,
  postsControllerGetPosts,
  PostListResponseDto,
} from "@rawfli/types";

type RouteParams = {
  boardId: string;
};

type SearchParams = {
  page?: string;
};

const ITEMS_PER_PAGE = 20;

type ApiEnvelope<T> = {
  data?: T;
};

async function getPopularPosts(boardId: number, page: number, limit: number): Promise<PostListResponseDto | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/v1/boards/${boardId}/posts/popular?page=${page}&limit=${limit}`,
      { cache: "no-store" },
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as ApiEnvelope<PostListResponseDto>;
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { boardId } = await params;
  const { page } = await searchParams;
  const parsedBoardId = Number(boardId);

  if (!Number.isFinite(parsedBoardId)) {
    notFound();
  }

  const currentPage = Math.max(1, Number(page) || 1);

  const [boardResp, boardsResp] = await Promise.all([
    boardsControllerGetBoard(parsedBoardId),
    boardsControllerGetBoards(),
  ]);

  if (!boardResp?.data) {
    notFound();
  }

  const board = boardResp.data;
  const boards = boardsResp?.data ?? [];
  const isGallery = board.type === "gallery";

  if (isGallery) {
    const [postsResp, popularPostsData] = await Promise.all([
      postsControllerGetPosts(parsedBoardId, {
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      }),
      getPopularPosts(parsedBoardId, 1, 3),
    ]);

    const getPosts = (data: PostListResponseDto | null) => {
      if (!data) return { posts: [], total: 0 };
      if (Array.isArray(data)) return { posts: data, total: data.length };
      return { posts: data.posts ?? [], total: data.total ?? 0 };
    };

    const { posts, total } = getPosts(postsResp?.data);
    const { posts: popularPosts } = getPosts(popularPostsData);
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

    return (
      <div className={styles.page}>
        <HomeHeader activeNav="gallery" />

        <main className={styles.main}>
          <div className={styles.grid}>
            <BoardSidebar
              boards={boards}
              currentBoardId={parsedBoardId}
              popularPosts={popularPosts}
            />

            <div className={styles.content}>
              <div className={styles.boardHeader}>
                <div className={styles.boardTitleWrap}>
                  <h2 className={styles.boardTitle}>{board.name}</h2>
                  <span className={styles.boardDescription}>{board.description}</span>
                </div>
                <Link href={`/boards/${parsedBoardId}/write`} className={styles.writeButton}>
                  <Pencil2Icon /> 포스트 작성
                </Link>
              </div>

              <GalleryPostGrid
                boardId={parsedBoardId}
                boardName={board.name}
                posts={posts}
              />

              <Pagination
                boardId={parsedBoardId}
                currentPage={currentPage}
                totalPages={totalPages}
              />
            </div>
          </div>
        </main>

        <HomeFooter />
      </div>
    );
  }

  const [articlesResp, popularResp] = await Promise.all([
    articleControllerGetArticles(parsedBoardId, {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }),
    articleControllerGetPopularArticles(parsedBoardId, {
      page: 1,
      limit: 5,
    }),
  ]);

  const getArticles = (data: ArticleListResponseDto) => {
    if (!data) return { articles: [], total: 0 };
    if (Array.isArray(data)) return { articles: data, total: data.length };
    return { articles: data.articles ?? [], total: data.total ?? 0 };
  };

  const { articles, total } = getArticles(articlesResp?.data);
  const { articles: popularArticles } = getArticles(popularResp?.data);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  return (
    <div className={styles.page}>
      <HomeHeader activeNav="community" />

      <main className={styles.main}>
        <div className={styles.grid}>
          <BoardSidebar
            boards={boards}
            currentBoardId={parsedBoardId}
            popularArticles={popularArticles}
          />

          <div className={styles.content}>
            <div className={styles.boardHeader}>
              <div className={styles.boardTitleWrap}>
                <h2 className={styles.boardTitle}>{board.name}</h2>
                <span className={styles.boardDescription}>{board.description}</span>
              </div>
              <Link href="/boards/write" className={styles.writeButton}>
                <Pencil2Icon /> 글쓰기
              </Link>
            </div>

            {currentPage === 1 && popularArticles.length > 0 && (
              <PopularArticleCards
                boardId={parsedBoardId}
                articles={popularArticles}
              />
            )}

            <ArticleTable boardId={parsedBoardId} articles={articles} />

            <Pagination
              boardId={parsedBoardId}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </div>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
