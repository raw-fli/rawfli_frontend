import { notFound } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import UserProfilePage from "@/components/user/UserProfilePage";
import "@/lib/server-api";
import { usersControllerGetUser } from "@rawfli/types";

type RouteParams = {
  userId: string;
};

export default async function UserPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { userId } = await params;
  const parsedUserId = Number(userId);

  if (!Number.isFinite(parsedUserId)) {
    notFound();
  }

  const userResp = (await usersControllerGetUser(parsedUserId));

  if (!userResp.result) {
    notFound();
  }

  const user = userResp.data;

  return (
    <div>
      <HomeHeader />
      <UserProfilePage user={user} />
      <HomeFooter />
    </div>
  );
}
