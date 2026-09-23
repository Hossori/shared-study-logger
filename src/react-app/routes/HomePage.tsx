/**
 * 認証必須のメイン画面（`/`）。`ProtectedRoute`の子ルートとしてのみ描画されるため、
 * `Outlet`のcontext経由で渡された`user`をそのまま利用できる。
 */
import { useOutletContext } from "react-router";
import type { AuthenticatedOutletContext } from "./ProtectedRoute";
import Layout from "../components/Layout";
import RecordsList from "../features/records/RecordsList";

export default function HomePage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();

  return (
    <Layout user={user}>
      <RecordsList />
    </Layout>
  );
}
