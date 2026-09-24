import { useOutletContext } from "react-router";
import type { AuthenticatedOutletContext } from "@/app/guards/ProtectedRoute";
import Layout from "@/app/shell/Layout";
import { AdminNotifications } from "@/features/notifications";

export default function AdminNotificationsPage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();
  return (
    <Layout user={user}>
      <AdminNotifications />
    </Layout>
  );
}
