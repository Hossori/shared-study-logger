import { OkResponseSchema } from "@shared/schemas";
import { apiDelete } from "../../lib/api";
import { isIosNonStandalone } from "@/lib/iosStandalone";
import { isPushSupported } from "./vapid";
import { withTimeout } from "./withTimeout";

const LOGOUT_PUSH_CLEANUP_MS = 5_000;
const SERVICE_WORKER_READY_MS = 5_000;

async function unsubscribePushOnLogoutInner(): Promise<void> {
  if (isIosNonStandalone() || !isPushSupported()) {
    return;
  }

  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    SERVICE_WORKER_READY_MS,
  );
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return;
  }

  try {
    await apiDelete("/api/push/subscribe", OkResponseSchema, {
      endpoint: subscription.endpoint,
    });
  } catch {
    // ログアウトをブロックしない
  }

  try {
    await subscription.unsubscribe();
  } catch {
    // ログアウトをブロックしない
  }
}

/**
 * ログアウト API の前に呼ぶ。Push 購読をサーバー・ブラウザ双方から解除する（可能な場合）。
 */
export async function unsubscribePushOnLogout(): Promise<void> {
  try {
    await withTimeout(unsubscribePushOnLogoutInner(), LOGOUT_PUSH_CLEANUP_MS);
  } catch {
    // タイムアウト・例外は握りつぶす
  }
}
