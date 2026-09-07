/**
 * `GET /api/groups`（自分が所属するグループ一覧）・
 * `GET /api/groups/:groupId/members`（所属メンバー公開情報）を
 * TanStack Queryで扱うフック。
 */
import { useQuery } from "@tanstack/react-query";
import type { Group, GroupMember } from "../../../shared/schemas";
import { apiGet } from "../lib/api";

export const groupsQueryKeys = {
  list: ["groups"] as const,
  members: (groupId: string | null) => ["groups", groupId, "members"] as const,
};

export function useGroupsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: groupsQueryKeys.list,
    queryFn: async (): Promise<Group[]> => {
      const { groups } = await apiGet<{ groups: Group[] }>("/api/groups");
      return groups;
    },
    enabled: options?.enabled ?? true,
  });
}

export function useGroupMembersQuery(
  groupId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: groupsQueryKeys.members(groupId),
    queryFn: async () => {
      const { members } = await apiGet<{ members: GroupMember[] }>(
        `/api/groups/${groupId}/members`,
      );
      return members;
    },
    enabled: (options?.enabled ?? true) && groupId !== null,
  });
}
