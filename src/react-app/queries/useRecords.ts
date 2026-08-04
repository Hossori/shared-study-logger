/**
 * `GET /api/groups/:groupId/records`（カーソルページネーション）・
 * `POST /api/groups/:groupId/records`（投稿）をTanStack Queryで扱うフック。
 */
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateStudyRecordRequest,
  StudyRecord,
} from "../../../shared/schemas";
import { apiGet, apiPost } from "../lib/api";

interface RecordsPage {
  records: StudyRecord[];
  nextCursor: string | null;
}

const RECORDS_PAGE_LIMIT = 20;

export const recordsQueryKeys = {
  list: (groupId: string | null) => ["records", groupId] as const,
};

export function useRecordsQuery(groupId: string | null) {
  return useInfiniteQuery({
    queryKey: recordsQueryKeys.list(groupId),
    queryFn: async ({ pageParam }): Promise<RecordsPage> => {
      const params = new URLSearchParams({
        limit: String(RECORDS_PAGE_LIMIT),
      });
      if (pageParam) params.set("cursor", pageParam);
      return apiGet<RecordsPage>(
        `/api/groups/${groupId}/records?${params.toString()}`,
      );
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: groupId !== null,
  });
}

export function useCreateRecordMutation(groupId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateStudyRecordRequest) => {
      if (!groupId) throw new Error("groupId is required");
      return apiPost<{ record: StudyRecord }>(
        `/api/groups/${groupId}/records`,
        input,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: recordsQueryKeys.list(groupId),
      });
    },
  });
}
