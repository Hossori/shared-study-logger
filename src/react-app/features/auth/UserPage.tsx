/**
 * ユーザーページ（自分・他人共通）。自分の場合のみ編集 / パスワード変更を出す。
 * ヘッダの「マイページ」もこの画面（`/users/:userId`）を指す。
 */
import { useState } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import type { AuthenticatedOutletContext } from "../../routes/ProtectedRoute";
import Layout from "../../components/Layout";
import UserAvatar from "../../components/UserAvatar";
import Button from "../../components/ui/Button";
import { useUserQuery } from "../../queries/useUser";
import ChangePasswordModal from "./ChangePasswordModal";
import EditProfileModal from "./EditProfileModal";
import { sectionClassName } from "./mypageStyles";

export default function UserPage() {
  const { user: me } = useOutletContext<AuthenticatedOutletContext>();
  const { userId } = useParams<{ userId: string }>();
  const isSelf = Boolean(userId && userId === me.id);
  const {
    data: fetchedUser,
    isLoading,
    isError,
  } = useUserQuery(isSelf ? undefined : userId);

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const profile = isSelf
    ? {
        id: me.id,
        displayName: me.displayName,
        bio: me.bio,
        avatarKey: me.avatarKey,
      }
    : fetchedUser
      ? {
          id: fetchedUser.id,
          displayName: fetchedUser.displayName,
          bio: fetchedUser.bio,
          avatarKey: fetchedUser.avatarKey,
        }
      : null;

  return (
    <Layout user={me}>
      <div className="mb-4">
        <Link
          to="/"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          ← ホームに戻る
        </Link>
        <h2 className="mt-2 text-xl font-bold text-gray-900">
          {isSelf ? "マイページ" : "ユーザー"}
        </h2>
      </div>

      {!isSelf && isLoading && (
        <p className="py-12 text-center text-sm text-gray-400">読み込み中...</p>
      )}

      {!isSelf && isError && (
        <p className="py-12 text-center text-sm text-red-500">
          ユーザー情報の取得に失敗しました。
        </p>
      )}

      {profile && (
        <section className={sectionClassName}>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <UserAvatar avatarKey={profile.avatarKey} className="h-20 w-20" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-gray-900">
                {profile.displayName}
              </h3>
              {profile.bio ? (
                <p className="mt-2 text-sm whitespace-pre-wrap text-gray-600">
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-2 text-sm text-gray-400">
                  自己紹介は未設定です
                </p>
              )}
            </div>
          </div>

          {isSelf && (
            <div className="mt-5 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
              <Button
                variant="secondary"
                onClick={() => setEditOpen(true)}
                className="px-4 py-2 text-sm"
              >
                編集
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPasswordOpen(true)}
                className="px-4 py-2 text-sm"
              >
                パスワード変更
              </Button>
            </div>
          )}
        </section>
      )}

      {isSelf && editOpen && (
        <EditProfileModal
          key={`${me.displayName}|${me.bio ?? ""}|${me.avatarKey ?? ""}`}
          initialDisplayName={me.displayName}
          initialBio={me.bio ?? ""}
          initialAvatarKey={me.avatarKey}
          onClose={() => setEditOpen(false)}
        />
      )}

      {isSelf && passwordOpen && (
        <ChangePasswordModal onClose={() => setPasswordOpen(false)} />
      )}
    </Layout>
  );
}
