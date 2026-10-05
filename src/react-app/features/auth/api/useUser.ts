import { useQuery } from "@tanstack/react-query";
import { ApiError, getUserById, type PublicUser } from "@/api";

export const userQueryKeys = {
  detail: (userId: string) => ["users", userId] as const,
};

/**
 * 公開ユーザープロフィール（`GET /api/users/:userId`）を取得するフック。
 * ログインユーザーの場合はログイン時に情報を取得しているため、クエリを実行しない。
 * @param userId - ユーザーID
 * @param isSelf - ログインユーザーかどうか（デフォルトは`false`）
 */
export function useUserQuery(userId: string, isSelf = false) {
  return useQuery({
    queryKey: userQueryKeys.detail(userId),
    enabled: !isSelf,
    queryFn: async (): Promise<PublicUser> => {
      if (!userId) {
        throw new ApiError(400, { error: "user_id_is_required" });
      }
      const { user } = await getUserById(userId);
      return user;
    },
  });
}
