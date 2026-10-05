/**
 * 記録フィルタ用の所属メンバー取得。
 * `GET /api/groups/:groupId/members`
 */
import { useQuery } from "@tanstack/react-query";
import { getGroupMembers } from "@/api";

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
      const { members } = await getGroupMembers(groupId!);
      return members;
    },
    enabled: (options?.enabled ?? true) && groupId !== null,
  });
}
