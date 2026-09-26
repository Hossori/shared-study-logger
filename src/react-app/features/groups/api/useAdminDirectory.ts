/**
 * 管理者向けユーザー・グループ・所属 API を TanStack Query で扱う。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AdminGroupsResponseSchema,
  AdminMemberResponseSchema,
  GroupResponseSchema,
  OkResponseSchema,
  UserResponseSchema,
  UsersResponseSchema,
  type AddGroupMemberRequest,
  type CreateAdminGroupRequest,
  type CreateAdminUserRequest,
} from "../../../../../shared/schemas";
import { apiDelete, apiGet, apiPost } from "../../../lib/api";
import { groupsQueryKeys } from "./useGroups";

export const adminDirectoryQueryKeys = {
  all: ["admin-directory"] as const,
  users: ["admin-directory", "users"] as const,
  groups: ["admin-directory", "groups"] as const,
};

async function invalidateDirectoryQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminDirectoryQueryKeys.all }),
    queryClient.invalidateQueries({ queryKey: groupsQueryKeys.list }),
  ]);
}

export function useAdminUsersQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminDirectoryQueryKeys.users,
    queryFn: () => apiGet("/api/admin/users", UsersResponseSchema),
    enabled,
  });
}

export function useAdminGroupsQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminDirectoryQueryKeys.groups,
    queryFn: () => apiGet("/api/admin/groups", AdminGroupsResponseSchema),
    enabled,
  });
}

export function useCreateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminUserRequest) =>
      apiPost("/api/admin/users", UserResponseSchema, input),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}

export function useCreateAdminGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminGroupRequest) =>
      apiPost("/api/admin/groups", GroupResponseSchema, input),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}

export function useAddGroupMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      groupId,
      userId,
    }: {
      groupId: string;
      userId: AddGroupMemberRequest["userId"];
    }) =>
      apiPost(
        `/api/admin/groups/${groupId}/members`,
        AdminMemberResponseSchema,
        { userId },
      ),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      apiDelete(
        `/api/admin/groups/${groupId}/members/${userId}`,
        OkResponseSchema,
      ),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}
