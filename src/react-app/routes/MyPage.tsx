/**
 * マイページのプレースホルダ。本格フォーム（プロフィール編集・パスワード変更等）は
 * マイページ担当ブランチで実装する。ヘッダーからの遷移先としてルートだけ先に用意する。
 */
import { useOutletContext } from "react-router";
import type { AuthenticatedOutletContext } from "./ProtectedRoute";
import Layout from "../components/Layout";

const headingClassName = "text-xl font-bold text-gray-900 sm:text-2xl";
const bodyClassName = "mt-2 text-sm text-gray-600 sm:text-base";

export default function MyPage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();

  return (
    <Layout user={user}>
      <h1 className={headingClassName}>マイページ</h1>
      <p className={bodyClassName}>
        プロフィール編集は準備中です（{user.displayName}）
      </p>
    </Layout>
  );
}
