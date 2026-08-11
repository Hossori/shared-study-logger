import { Navigate, useOutletContext } from "react-router";
import type { AuthenticatedOutletContext } from "../../routes/ProtectedRoute";

export default function MyPage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();
  return <Navigate to={`/users/${user.id}`} replace />;
}
