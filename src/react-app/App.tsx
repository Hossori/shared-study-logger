import { RouterProvider } from "react-router";
import NotificationClickRefresh from "./features/push/NotificationClickRefresh";
import { router } from "./routes/router";

function App() {
  return (
    <>
      <NotificationClickRefresh />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
