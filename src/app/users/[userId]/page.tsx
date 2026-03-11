import { notFound } from "next/navigation";
import HomeHeader from "@/components/home/HomeHeader";
import HomeFooter from "@/components/home/HomeFooter";
import UserProfilePage from "@/components/user/UserProfilePage";
import {
  usersControllerGetUser,
  type UserInfoResponseDto,
} from "@rawfli/types";

type RouteParams = {
  userId: string;
};

type WrappedResponse = {
  result: boolean;
  code: number;
  data: UserInfoResponseDto;
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

  const userResp = (await usersControllerGetUser(
    parsedUserId,
  )) as unknown as WrappedResponse;

  if (!userResp?.data) {
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
