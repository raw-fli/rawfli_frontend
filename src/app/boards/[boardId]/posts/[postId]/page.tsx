import { notFound } from "next/navigation";
import HomeFooter from "@/components/home/HomeFooter";
import HomeHeader from "@/components/home/HomeHeader";
import PostHead from "@/components/post/PostHead";
import PostBody from "@/components/post/PostBody";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import styles from "./page.module.css";
import {
  postsControllerGetPost,
  boardsControllerGetBoard,
} from "@rawfli/types";

type RouteParams = {
  boardId: string;
  postId: string;
};

export default async function PostDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { boardId, postId } = await params;
  const parsedBoardId = Number(boardId);
  const parsedPostId = Number(postId);

  if (!Number.isFinite(parsedBoardId) || !Number.isFinite(parsedPostId)) {
    notFound();
  }

  const [postResp, boardResp] = await Promise.all([
    postsControllerGetPost(parsedBoardId, parsedPostId),
    boardsControllerGetBoard(parsedBoardId),
  ]);

  if (!postResp?.data) {
    notFound();
  }

  const post = postResp.data;
  const board = boardResp?.data;
  const boardName = board?.name ?? "갤러리";

  const formattedCreatedAt = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(post.createdAt));

  return (
    <div className={styles.page}>
      <HomeHeader />

      <main className={styles.main}>
        <div className={styles.grid}>
          <div>
            <article className={styles.postCard}>
              <PostHead
                post={post}
                boardId={parsedBoardId}
                boardName={boardName}
                formattedDate={formattedCreatedAt}
              />
              <PostBody post={post} />
            </article>
          </div>

          <ArticleSidebar trending={[]} todayPosts={0} />
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
