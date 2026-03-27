import { notFound } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import PostDetailView from "../../../components/post/PostDetailView";
import "@/lib/server-api";
import styles from "./page.module.css";
import { postsControllerGetPost } from "@rawfli/types";

type RouteParams = {
  postId: string;
};

type SearchParams = {
  photo?: string;
};

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: Promise<RouteParams>;
  searchParams: Promise<SearchParams>;
}) {
  const { postId } = await params;
  const { photo } = await searchParams;

  const parsedPostId = Number(postId);
  if (!Number.isFinite(parsedPostId)) {
    notFound();
  }

  try {
    const postResp = await postsControllerGetPost(parsedPostId);
    const post = postResp.data;

    return (
      <div className={styles.page}>
        <HomeHeader activeNav="posts" />

        <main className={styles.main}>
          <PostDetailView post={post} initialPhotoId={photo} />
        </main>

        <HomeFooter />
      </div>
    );
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 404) {
      notFound();
    }
    throw error;
  }
}