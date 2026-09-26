/**
 * 記録フィルタ用の所属メンバー取得。
 * `GET /api/groups/:groupId/members`
 */
import { useQuery } from "@tanstack/react-query";
import { GroupMembersResponseSchema } from "@shared/schemas";
import { apiGet } from "../../../lib/api";

export const groupMembersQueryKeys = {
  members: (groupId: string | null) => ["groups", groupId, "members"] as const,
};

export function useGroupMembersQuery(
  groupId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: groupMembersQueryKeys.members(groupId),
    queryFn: async () => {
      const { members } = await apiGet(
        `/api/groups/${groupId}/members`,
        GroupMembersResponseSchema,
      );
      return members;
    },
    enabled: (options?.enabled ?? true) && groupId !== null,
  });
}
