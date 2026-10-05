/**
 * アプリ内通知 API（ユーザー向け一覧 / 管理者 CRUD）を TanStack Query で扱う。
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteAdminNotification,
  getAdminNotifications,
  getNotifications,
  patchAdminNotification,
  postAdminNotification,
  type CreateInAppNotificationRequest,
  type UpdateInAppNotificationRequest,
} from "@/api";

export const notificationQueryKeys = {
  all: ["notifications"] as const,
  enabled: ["notifications", "enabled"] as const,
  admin: ["notifications", "admin"] as const,
};

export function useEnabledNotificationsQuery() {
  return useQuery({
    queryKey: notificationQueryKeys.enabled,
    queryFn: () => getNotifications(),
  });
}

export function useAdminNotificationsQuery(enabled: boolean) {
  return useQuery({
    queryKey: notificationQueryKeys.admin,
    queryFn: () => getAdminNotifications(),
    enabled,
  });
}

export function useCreateNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInAppNotificationRequest) =>
      postAdminNotification(input),
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
    }) => patchAdminNotification(id, { enabled }),
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
    mutationFn: (id: string) => deleteAdminNotification(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: notificationQueryKeys.all,
      });
    },
  });
}
