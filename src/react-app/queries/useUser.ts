/**
 * 公開ユーザープロフィール（`GET /api/users/:userId`）を取得するフック。
 */
import { useQuery } from "@tanstack/react-query";
import type { PublicUser } from "../../../shared/schemas";
import { apiGet, ApiError } from "../lib/api";

export const userQueryKeys = {
  detail: (userId: string) => ["users", userId] as const,
};

export function useUserQuery(userId: string | undefined) {
  return useQuery({
    queryKey: userQueryKeys.detail(userId ?? ""),
    enabled: Boolean(userId),
    queryFn: async (): Promise<PublicUser> => {
      if (!userId) {
        throw new ApiError(400, { error: "missing_user_id" });
      }
      const { user } = await apiGet<{ user: PublicUser }>(
        `/api/users/${userId}`,
      );
      return user;
    },
    retry: false,
  });
}
