import { RouterProvider } from "react-router";
import NotificationClickRefresh from "@/app/effects/NotificationClickRefresh";
import { AppProviders } from "@/app/providers";
import { router } from "@/app/router";
import { useVisualViewportFrame } from "@/app/shell/useVisualViewportFrame";
import { ServiceWorkerUpdateDialog } from "@/features/pwa";

function App() {
  useVisualViewportFrame();
  return (
    <AppProviders>
      <NotificationClickRefresh />
      <ServiceWorkerUpdateDialog />
      <RouterProvider router={router} />
    </AppProviders>
  );
}

export default App;
