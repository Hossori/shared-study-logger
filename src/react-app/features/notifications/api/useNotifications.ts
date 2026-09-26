/**
 * アプリ内通知 API（ユーザー向け一覧 / 管理者 CRUD）を TanStack Query で扱う。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  InAppNotificationResponseSchema,
  InAppNotificationsResponseSchema,
  OkResponseSchema,
  type CreateInAppNotificationRequest,
  type UpdateInAppNotificationRequest,
} from "../../../../../shared/schemas";
import { apiDelete, apiGet, apiPatch, apiPost } from "../../../lib/api";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  enabled: ["notifications", "enabled"] as const,
  admin: ["notifications", "admin"] as const,
};

export function useEnabledNotificationsQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.enabled,
    queryFn: () =>
      apiGet("/api/notifications", InAppNotificationsResponseSchema),
  });
}

export function useAdminNotificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: notificationQueryKeys.admin,
    queryFn: () =>
      apiGet("/api/admin/notifications", InAppNotificationsResponseSchema),
    enabled,
  });
}

export function useCreateNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInAppNotificationRequest) =>
      apiPost(
        "/api/admin/notifications",
        InAppNotificationResponseSchema,
        input,
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useToggleNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      enabled,
    }: {
      id: string;
      enabled: UpdateInAppNotificationRequest["enabled"];
    }) =>
      apiPatch(
        `/api/admin/notifications/${id}`,
        InAppNotificationResponseSchema,
        { enabled },
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiDelete(`/api/admin/notifications/${id}`, OkResponseSchema),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}
