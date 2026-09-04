/**
 * `GET /api/groups/:groupId/records`（カーソルページネーション）・
 * `POST /api/groups/:groupId/records`（投稿）・
 * `PATCH /api/groups/:groupId/records/:recordId`（編集）・
 * `DELETE /api/groups/:groupId/records/:recordId`（削除）・
 * リアクション付与/取消/ユーザー一覧をTanStack Queryで扱うフック。
 * リアクション件数は `onMutate` で一覧キャッシュを楽観更新する。
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  CreateStudyRecordRequest,
  ReactionStamp,
  ReactionSummary,
  RecordReactionEntry,
  StudyRecord,
  UpdateStudyRecordRequest,
} from "../../../shared/schemas";
import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/api";
import {
  applyAddReaction,
  applyRemoveReaction,
} from "../lib/reactionSummaries";

interface RecordsPage {
  records: StudyRecord[];
  nextCursor: string | null;
}

const RECORDS_PAGE_LIMIT = 20;

export const recordsQueryKeys = {
  all: ["records"] as const,
  list: (groupId: string | null) => ["records", groupId] as const,
  reactions: (groupId: string | null, recordId: string) =>
    ["records", groupId, recordId, "reactions"] as const,
};

type RecordsInfiniteData = InfiniteData<RecordsPage, string | undefined>;

function patchRecordReactions(
  queryClient: QueryClient,
  groupId: string | null,
  recordId: string,
  updater: (reactions: ReactionSummary[]) => ReactionSummary[],
) {
  queryClient.setQueryData<RecordsInfiniteData>(
    recordsQueryKeys.list(groupId),
    (current) => {
      if (!current) return current;
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          records: page.records.map((record) =>
            record.id === recordId
              ? { ...record, reactions: updater(record.reactions) }
              : record,
          ),
        })),
      };
    },
  );
}

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

export function useRecordReactionsQuery(
  groupId: string | null,
  recordId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: recordsQueryKeys.reactions(groupId, recordId),
    queryFn: () =>
      apiGet<{ reactions: RecordReactionEntry[] }>(
        `/api/groups/${groupId}/records/${recordId}/reactions`,
      ),
    enabled: enabled && groupId !== null,
  });
}

export function useAddRecordReactionMutation(groupId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      recordId,
      stamp,
    }: {
      recordId: string;
      stamp: ReactionStamp;
    }) => {
      if (!groupId) throw new Error("groupId is required");
      return apiPost<{ reaction: RecordReactionEntry }>(
        `/api/groups/${groupId}/records/${recordId}/reactions`,
        { stamp },
      );
    },
    onMutate: async ({ recordId, stamp }) => {
      const listKey = recordsQueryKeys.list(groupId);
      await queryClient.cancelQueries({ queryKey: listKey, exact: true });
      const previous = queryClient.getQueryData<RecordsInfiniteData>(listKey);
      patchRecordReactions(queryClient, groupId, recordId, (reactions) =>
        applyAddReaction(reactions, stamp),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          recordsQueryKeys.list(groupId),
          context.previous,
        );
      }
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: recordsQueryKeys.list(groupId),
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: recordsQueryKeys.reactions(groupId, variables.recordId),
      });
    },
  });
}

export function useDeleteRecordReactionMutation(groupId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      recordId,
      stamp,
    }: {
      recordId: string;
      stamp: ReactionStamp;
    }) => {
      if (!groupId) throw new Error("groupId is required");
      return apiDelete<{ ok: boolean }>(
        `/api/groups/${groupId}/records/${recordId}/reactions/${stamp}`,
      );
    },
    onMutate: async ({ recordId, stamp }) => {
      const listKey = recordsQueryKeys.list(groupId);
      await queryClient.cancelQueries({ queryKey: listKey, exact: true });
      const previous = queryClient.getQueryData<RecordsInfiniteData>(listKey);
      patchRecordReactions(queryClient, groupId, recordId, (reactions) =>
        applyRemoveReaction(reactions, stamp),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          recordsQueryKeys.list(groupId),
          context.previous,
        );
      }
    },
    onSettled: async (_data, _error, variables) => {
      await queryClient.invalidateQueries({
        queryKey: recordsQueryKeys.list(groupId),
        exact: true,
      });
      await queryClient.invalidateQueries({
        queryKey: recordsQueryKeys.reactions(groupId, variables.recordId),
      });
    },
  });
}
