/**
 * `GET /api/groups` の query 定義。
 * groups と records の両方が同じキャッシュを使うため、feature の外に置く。
 */
import { queryOptions } from "@tanstack/react-query";
import { GroupsResponseSchema, type Group } from "@shared/schemas";
import { apiGet } from "./api";

export const groupsQueryKeys = {
  list: ["groups"] as const,
};

export function groupsListQueryOptions() {
  return queryOptions({
    queryKey: groupsQueryKeys.list,
    queryFn: async (): Promise<Group[]> => {
      const { groups } = await apiGet("/api/groups", GroupsResponseSchema);
      return groups;
    },
  });
}
