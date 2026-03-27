import Link from "next/link";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import PostGrid from "@/components/post/PostGrid";
import "@/lib/server-api";
import boardStyles from "@/components/board/BoardPage.module.css";
import styles from "./page.module.css";
import {
  PostListResponseDto,
  postsControllerGetPopularPosts,
  postsControllerGetPosts,
} from "@rawfli/types";

type SearchParams = {
  page?: string;
  sort?: string;
};

const ITEMS_PER_PAGE = 20;
const PAGE_GROUP_SIZE = 5;

function normalizeSort(sort?: string): "latest" | "popular" {
  return sort === "popular" ? "popular" : "latest";
}

function getPosts(data: PostListResponseDto | undefined) {
  if (!data) return { posts: [], total: 0 };
  if (Array.isArray(data)) return { posts: data, total: data.length };
  return { posts: data.posts ?? [], total: data.total ?? 0 };
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { page, sort } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const currentSort = normalizeSort(sort);

  const listResp = await (currentSort === "popular"
    ? postsControllerGetPopularPosts({ page: currentPage, limit: ITEMS_PER_PAGE })
    : postsControllerGetPosts({ page: currentPage, limit: ITEMS_PER_PAGE }));

  const { posts, total } = getPosts(listResp?.data);
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const groupStart = Math.floor((currentPage - 1) / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE + 1;
  const groupEnd = Math.min(groupStart + PAGE_GROUP_SIZE - 1, totalPages);
  const pages = Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i);

  const makeHref = (nextPage: number, nextSort: "latest" | "popular" = currentSort) =>
    nextSort === "latest" ? `/posts?page=${nextPage}` : `/posts?page=${nextPage}&sort=${nextSort}`;

  return (
    <div className={boardStyles.page}>
      <HomeHeader activeNav="posts" />

      <main className={boardStyles.main}>
        <div className={boardStyles.content}>
            <div className={boardStyles.boardHeader}>
              <div className={boardStyles.boardTitleWrap}>
                <h2 className={boardStyles.boardTitle}>포스트</h2>
                <span className={boardStyles.boardDescription}>오늘의 작품을 둘러보고 영감을 얻어보세요.</span>
              </div>
              <Link href="/posts/write" className={boardStyles.writeButton}>
                포스트 작성
              </Link>
            </div>

            <div className={styles.sortTabs}>
              <Link
                href="/posts?page=1"
                className={`${styles.sortTab} ${currentSort === "latest" ? styles.sortTabActive : ""}`}
              >
                최근 업데이트순
              </Link>
              <Link
                href="/posts?page=1&sort=popular"
                className={`${styles.sortTab} ${currentSort === "popular" ? styles.sortTabActive : ""}`}
              >
                인기순
              </Link>
              <span className={styles.countMeta}>총 {total.toLocaleString()}개</span>
            </div>

            <PostGrid posts={posts} />

            {totalPages > 1 && (
              <div className={boardStyles.pagination}>
                <Link
                  href={makeHref(1)}
                  className={boardStyles.pageNavButton}
                  aria-label="첫 페이지"
                  aria-disabled={currentPage === 1}
                >
                  «
                </Link>
                <Link
                  href={makeHref(Math.max(1, currentPage - 1))}
                  className={boardStyles.pageNavButton}
                  aria-label="이전 페이지"
                  aria-disabled={currentPage === 1}
                >
                  ‹
                </Link>

                <div className={boardStyles.pageNumbers}>
                  {pages.map((p) => (
                    <Link
                      key={p}
                      href={makeHref(p)}
                      className={`${boardStyles.pageNumberButton} ${p === currentPage ? boardStyles.pageNumberActive : ""}`}
                    >
                      {p}
                    </Link>
                  ))}
                </div>

                <Link
                  href={makeHref(Math.min(totalPages, currentPage + 1))}
                  className={boardStyles.pageNavButton}
                  aria-label="다음 페이지"
                  aria-disabled={currentPage === totalPages}
                >
                  ›
                </Link>
                <Link
                  href={makeHref(totalPages)}
                  className={boardStyles.pageNavButton}
                  aria-label="마지막 페이지"
                  aria-disabled={currentPage === totalPages}
                >
                  »
                </Link>
              </div>
            )}
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
