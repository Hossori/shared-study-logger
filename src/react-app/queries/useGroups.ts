/**
 * `GET /api/groups`（自分が所属するグループ一覧）をTanStack Queryで扱うフック。
 */
import { useQuery } from "@tanstack/react-query";
import type { Group } from "../../../shared/schemas";
import { apiGet } from "../lib/api";

export const groupsQueryKeys = {
  list: ["groups"] as const,
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
