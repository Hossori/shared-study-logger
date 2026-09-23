import { useOutletContext } from "react-router";
import type { AuthenticatedOutletContext } from "@/app/guards/ProtectedRoute";
import Layout from "@/app/shell/Layout";
import { AdminDirectory } from "@/features/groups";

export default function AdminDirectoryPage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();
  return (
    <Layout user={user}>
      <AdminDirectory />
    </Layout>
  );
}
