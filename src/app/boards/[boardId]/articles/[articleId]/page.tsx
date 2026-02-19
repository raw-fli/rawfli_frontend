import type { ArticleListResponse, ArticleResponse, Board } from "@/lib/types";
import { notFound } from "next/navigation";
import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";
import ArticleHead from "@/components/article/ArticleHead";
import ArticleBody from "@/components/article/ArticleBody";
import CommentSection from "@/components/article/CommentSection";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import { fetchPublicApi } from "@/lib/publicApi";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "./page.module.css";

type RouteParams = {
  boardId: string;
  articleId: string;
};

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { boardId, articleId } = await params;
  const parsedBoardId = Number(boardId);
  const parsedArticleId = Number(articleId);

  if (!Number.isFinite(parsedBoardId) || !Number.isFinite(parsedArticleId)) {
    notFound();
  }

  const [article, board, trendingData] = await Promise.all([
    fetchPublicApi<ArticleResponse>(`/api/v1/boards/${parsedBoardId}/articles/${parsedArticleId}`),
    fetchPublicApi<Board>(`/api/v1/boards/${parsedBoardId}`),
    fetchPublicApi<ArticleListResponse>(`/api/v1/boards/${parsedBoardId}/articles/popular?limit=4`),
  ]);

  if (!article) {
    notFound();
  }

  const boardName = board?.name ?? "커뮤니티";

  const formattedCreatedAt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(article.createdAt));

  const trending =
    trendingData?.articles
      .filter((item) => item.id !== parsedArticleId)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        boardId: parsedBoardId,
        category: boardName,
        title: item.title,
      })) ?? [];

  const todayPosts = trendingData?.total ?? 0;

  const heroImageKey =
    article?.referencedPhotos?.[0]?.imageKey ?? article?.attachedImages?.[0]?.key;
  const heroImageUrl = toS3ImageUrl(heroImageKey);

  return (
    <div className={styles.page}>
      <HomeHeader />

      <main className={styles.main}>
        <div className={styles.grid}>
          <div>
            <article className={styles.articleCard}>
              <ArticleHead
                article={article}
                boardName={boardName}
                formattedDate={formattedCreatedAt}
              />
              <ArticleBody article={article} heroImageUrl={heroImageUrl} boardId={parsedBoardId} articleId={parsedArticleId} />
            </article>

            <CommentSection comments={article.comments} boardId={parsedBoardId} articleId={parsedArticleId} />
          </div>

          <ArticleSidebar trending={trending} todayPosts={todayPosts} />
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}