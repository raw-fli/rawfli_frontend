import { redirect } from "next/navigation";

type RouteParams = {
  boardId: string;
};

export default async function LegacyBoardPostWritePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { boardId } = await params;
  redirect(`/posts/write?boardId=${encodeURIComponent(boardId)}`);
}
