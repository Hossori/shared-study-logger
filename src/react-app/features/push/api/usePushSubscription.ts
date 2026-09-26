/**
 * Push購読関連API（`GET /api/push/vapid-public-key`, `POST/DELETE /api/push/subscribe`）を
 * TanStack Queryで扱うフック。
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  OkResponseSchema,
  VapidPublicKeyResponseSchema,
  type PushSubscriptionInput,
} from "../../../../../shared/schemas";
import { apiDelete, apiGet, apiPost } from "../../../lib/api";

export const pushQueryKeys = {
  vapidPublicKey: ["push", "vapidPublicKey"] as const,
};

export function useVapidPublicKeyQuery() {
  return useQuery({
    queryKey: pushQueryKeys.vapidPublicKey,
    queryFn: async (): Promise<string> => {
      const { publicKey } = await apiGet(
        "/api/push/vapid-public-key",
        VapidPublicKeyResponseSchema,
      );
      return publicKey;
    },
    staleTime: Infinity,
  });
}

export function useSubscribePushMutation() {
  return useMutation({
    mutationFn: (input: PushSubscriptionInput) =>
      apiPost("/api/push/subscribe", OkResponseSchema, input),
  });
}

export function useUnsubscribePushMutation() {
  return useMutation({
    mutationFn: (input: { endpoint: string }) =>
      apiDelete("/api/push/subscribe", OkResponseSchema, input),
  });
}
