import { Navigate, useOutletContext } from "react-router";
import type { AuthenticatedOutletContext } from "@/app/guards/ProtectedRoute";

export default function MyPage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();
  return <Navigate to={`/users/${user.id}`} replace />;
}
