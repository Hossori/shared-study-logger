import { RouterProvider } from "react-router";
import { ConfirmProvider } from "./components/ConfirmProvider";
import NotificationClickRefresh from "./features/push/NotificationClickRefresh";
import ServiceWorkerUpdateDialog from "./features/pwa/ServiceWorkerUpdateDialog";
import { router } from "./routes/router";

function App() {
  return (
    <ConfirmProvider>
      <NotificationClickRefresh />
      <ServiceWorkerUpdateDialog />
      <RouterProvider router={router} />
    </ConfirmProvider>
  );
}

export default App;
