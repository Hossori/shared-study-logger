/**
 * `GET /api/groups/:groupId/records`（カーソルページネーション）・
 * `POST /api/groups/:groupId/records`（投稿）・
 * `PATCH /api/groups/:groupId/records/:recordId`（編集）・
 * `DELETE /api/groups/:groupId/records/:recordId`（削除）をTanStack Queryで扱うフック。
 */
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type {
  CreateStudyRecordRequest,
  StudyRecord,
  UpdateStudyRecordRequest,
} from "../../../shared/schemas";
import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/api";

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

export function useUpdateRecordMutation(groupId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      recordId,
      input,
    }: {
      recordId: string;
      input: UpdateStudyRecordRequest;
    }) => {
      if (!groupId) throw new Error("groupId is required");
      return apiPatch<{ record: StudyRecord }>(
        `/api/groups/${groupId}/records/${recordId}`,
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

export function useDeleteRecordMutation(groupId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recordId: string) => {
      if (!groupId) throw new Error("groupId is required");
      return apiDelete<{ ok: boolean }>(
        `/api/groups/${groupId}/records/${recordId}`,
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: recordsQueryKeys.list(groupId),
      });
    },
  });
}
