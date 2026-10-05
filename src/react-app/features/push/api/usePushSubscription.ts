/**
 * Push購読関連API（`GET /api/push/vapid-public-key`, `POST/DELETE /api/push/subscribe`）を
 * TanStack Queryで扱うフック。
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  deletePushSubscribe,
  getPushVapidPublicKey,
  postPushSubscribe,
  type PushSubscription,
  type PushUnsubscribeRequest,
} from "@/api";

export const pushQueryKeys = {
  vapidPublicKey: ["push", "vapidPublicKey"] as const,
};

export function useVapidPublicKeyQuery() {
  return useQuery({
    queryKey: pushQueryKeys.vapidPublicKey,
    queryFn: async (): Promise<string> => {
      const { publicKey } = await getPushVapidPublicKey();
      return publicKey;
    },
    staleTime: Infinity,
  });
}

export function useSubscribePushMutation() {
  return useMutation({
    mutationFn: (input: PushSubscription) => postPushSubscribe(input),
  });
}

export function useUnsubscribePushMutation() {
  return useMutation({
    mutationFn: (input: PushUnsubscribeRequest) => deletePushSubscribe(input),
  });
}
