/**
 * マイページ（プロフィール編集・アバター選択・パスワード変更）。
 */
import { Link, useOutletContext } from "react-router";
import type { AuthenticatedOutletContext } from "../../routes/ProtectedRoute";
import Layout from "../../components/Layout";
import PasswordSection from "./PasswordSection";
import ProfileSection from "./ProfileSection";

export default function MyPage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();

  return (
    <Layout user={user}>
      <div className="mb-4">
        <Link
          to="/"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          ← ホームに戻る
        </Link>
        <h2 className="mt-2 text-xl font-bold text-gray-900">マイページ</h2>
        <p className="mt-1 text-sm text-gray-500">
          表示名・自己紹介・アバター・パスワードを設定できます。
        </p>
      </div>

      <div className="space-y-6">
        <ProfileSection
          key={`${user.displayName}|${user.bio ?? ""}|${user.avatarKey ?? ""}`}
          initialDisplayName={user.displayName}
          initialBio={user.bio ?? ""}
          initialAvatarKey={user.avatarKey}
        />
        <PasswordSection />
      </div>
    </Layout>
  );
}
