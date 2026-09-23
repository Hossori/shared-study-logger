/**
 * 管理者向けユーザー・グループ・所属 API を TanStack Query で扱う。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddGroupMemberRequest,
  AdminGroup,
  CreateAdminGroupRequest,
  CreateAdminUserRequest,
  Group,
  User,
} from "../../../shared/schemas";
import { apiDelete, apiGet, apiPost } from "../lib/api";
import { groupsQueryKeys } from "./useGroups";

interface AdminUsersResponse {
  users: User[];
}

interface AdminUserResponse {
  user: User;
}

interface AdminGroupsResponse {
  groups: AdminGroup[];
}

interface AdminGroupResponse {
  group: Group;
}

interface AdminMemberResponse {
  member: User;
}

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
    queryFn: () => apiGet<AdminUsersResponse>("/api/admin/users"),
    enabled,
  });
}

export function useAdminGroupsQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminDirectoryQueryKeys.groups,
    queryFn: () => apiGet<AdminGroupsResponse>("/api/admin/groups"),
    enabled,
  });
}

export function useCreateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminUserRequest) =>
      apiPost<AdminUserResponse>("/api/admin/users", input),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}

export function useCreateAdminGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminGroupRequest) =>
      apiPost<AdminGroupResponse>("/api/admin/groups", input),
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
      apiPost<AdminMemberResponse>(`/api/admin/groups/${groupId}/members`, {
        userId,
      }),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      apiDelete<{ ok: true }>(`/api/admin/groups/${groupId}/members/${userId}`),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}
