/**
 * アプリ内通知 API（ユーザー向け一覧 / 管理者 CRUD）を TanStack Query で扱う。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateInAppNotificationRequest,
  InAppNotification,
  UpdateInAppNotificationRequest,
} from "../../../shared/schemas";
import { apiDelete, apiGet, apiPatch, apiPost } from "../lib/api";

interface NotificationsResponse {
  notifications: InAppNotification[];
}

interface NotificationResponse {
  notification: InAppNotification;
}

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  enabled: ["notifications", "enabled"] as const,
  admin: ["notifications", "admin"] as const,
};

export function useEnabledNotificationsQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.enabled,
    queryFn: () => apiGet<NotificationsResponse>("/api/notifications"),
  });
}

export function useAdminNotificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: notificationQueryKeys.admin,
    queryFn: () => apiGet<NotificationsResponse>("/api/admin/notifications"),
    enabled,
  });
}

export function useCreateNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInAppNotificationRequest) =>
      apiPost<NotificationResponse>("/api/admin/notifications", input),
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
      apiPatch<NotificationResponse>(`/api/admin/notifications/${id}`, {
        enabled,
      }),
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
      apiDelete<{ ok: true }>(`/api/admin/notifications/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}
