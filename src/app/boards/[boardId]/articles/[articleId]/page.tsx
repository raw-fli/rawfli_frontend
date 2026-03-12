import { notFound } from "next/navigation";
import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";
import ArticleHead from "@/components/article/ArticleHead";
import ArticleBody from "@/components/article/ArticleBody";
import CommentSection from "@/components/article/CommentSection";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import { toS3ImageUrl } from "@/shared/utils/image";
import styles from "./page.module.css";
import { articleControllerGetArticle, articleControllerGetPopularArticles, boardsControllerGetBoard } from "@rawfli/types";
import "@/lib/server-api";

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

  const [articleResp, boardResp, trendingDataResp] = await Promise.all([
    articleControllerGetArticle(parsedBoardId, parsedArticleId),
    boardsControllerGetBoard(parsedBoardId),
    articleControllerGetPopularArticles(parsedBoardId, { limit: 4 }),
  ]);

  if (!articleResp) {
    notFound();
  }
  const article = articleResp.data;
  const board = boardResp.data;
  const trendingData = trendingDataResp.data;

  const boardName = board.name ?? "커뮤니티";

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

  const imageUrls = [
    ...article.referencedPhotos.map((p) => toS3ImageUrl(p.imageKey)),
    ...article.attachedImages.map((img) => toS3ImageUrl(img.key)),
  ];

  return (
    <div className={styles.page}>
      <HomeHeader />

      <main className={styles.main}>
        <div className={styles.grid}>
          <div>
            <article className={styles.articleCard}>
              <ArticleHead
                article={article}
                boardId={parsedBoardId}
                boardName={boardName}
                formattedDate={formattedCreatedAt}
              />
              <ArticleBody article={article} imageUrls={imageUrls} boardId={parsedBoardId} articleId={parsedArticleId} />
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