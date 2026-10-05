/**
 * 管理者向けユーザー・グループ・所属 API を TanStack Query で扱う。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminGroupMember,
  getAdminGroups,
  getAdminUsers,
  postAdminGroup,
  postAdminGroupMember,
  postAdminUser,
  type AddGroupMemberRequest,
  type CreateAdminGroupRequest,
  type CreateAdminUserRequest,
} from "@/api";
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
    queryFn: () => getAdminUsers(),
    enabled,
  });
}

export function useAdminGroupsQuery(enabled: boolean) {
  return useQuery({
    queryKey: adminDirectoryQueryKeys.groups,
    queryFn: () => getAdminGroups(),
    enabled,
  });
}

export function useCreateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminUserRequest) => postAdminUser(input),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}

export function useCreateAdminGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminGroupRequest) => postAdminGroup(input),
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
    }) => postAdminGroupMember(groupId, { userId }),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      deleteAdminGroupMember(groupId, userId),
    onSuccess: async () => {
      await invalidateDirectoryQueries(queryClient);
    },
  });
}
