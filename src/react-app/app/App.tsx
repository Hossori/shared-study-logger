import { Suspense } from "react";
import { RouterProvider } from "react-router";
import NotificationClickRefresh from "@/app/effects/NotificationClickRefresh";
import { AppProviders } from "@/app/providers";
import { router } from "@/app/router";
import LoadingScreen from "@/app/shell/LoadingScreen";
import { ServiceWorkerUpdateDialog } from "@/features/pwa";

function App() {
  return (
    <AppProviders>
      <NotificationClickRefresh />
      <ServiceWorkerUpdateDialog />
      <Suspense fallback={<LoadingScreen />}>
        <RouterProvider router={router} />
      </Suspense>
    </AppProviders>
  );
}

export default App;
