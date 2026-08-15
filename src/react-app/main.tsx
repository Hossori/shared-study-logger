import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import {
  clearServiceWorkerUpdate,
  requestServiceWorkerUpdate,
  setServiceWorkerRegistration,
  setWaitingServiceWorker,
  shouldReloadForServiceWorkerControllerChange,
} from "./lib/serviceWorkerUpdate";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);

// カスタムService Worker(public/sw.ts, injectManifestでビルド)を登録する。
// 開発: VitePWA `devOptions` が配信する `/dev-sw.js?dev-sw`
// 本番: injectManifest 出力の `/sw.js`
function registerServiceWorker(): void {
  const serviceWorkerUrl = import.meta.env.DEV ? "/dev-sw.js?dev-sw" : "/sw.js";

  navigator.serviceWorker
    .register(serviceWorkerUrl, {
      type: "module",
      updateViaCache: "none",
    })
    .then((registration) => {
      setServiceWorkerRegistration(registration);

      const notifyWaitingWorker = () => {
        if (registration.waiting) {
          setWaitingServiceWorker(registration);
        }
      };

      notifyWaitingWorker();
      registration.addEventListener("updatefound", () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener("statechange", () => {
          if (
            installingWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            notifyWaitingWorker();
          }
        });
      });

      // 登録直後と復帰時の両方で、SW スクリプトをキャッシュを介さず確認する。
      void requestServiceWorkerUpdate().catch((error: unknown) => {
        console.error("Service worker update check failed", error);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState !== "visible") return;
        void requestServiceWorkerUpdate().catch((error: unknown) => {
          console.error("Service worker update check failed", error);
        });
      });
    })
    .catch((error: unknown) => {
      console.error("Service worker registration failed", error);
    });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    clearServiceWorkerUpdate();
    if (shouldReloadForServiceWorkerControllerChange()) {
      window.location.reload();
    }
  });
}

// Push通知の購読(`useNotificationOptIn`)は`navigator.serviceWorker.ready`を前提にしている。
if ("serviceWorker" in navigator) {
  window.addEventListener("load", registerServiceWorker, { once: true });
}
