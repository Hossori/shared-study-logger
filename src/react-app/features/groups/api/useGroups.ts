/**
 * `GET /api/groups`（自分が所属するグループ一覧）を TanStack Query で扱う。
 */
import { useQuery } from "@tanstack/react-query";
import { groupsListQueryOptions } from "../../../lib/groupsListQuery";

export function useGroupsQuery(options?: { enabled?: boolean }) {
  return useQuery({
    ...groupsListQueryOptions(),
    enabled: options?.enabled ?? true,
  });
}
