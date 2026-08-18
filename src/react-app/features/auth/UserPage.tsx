/**
 * ユーザーページ（自分・他人共通）。自分の場合のみ Push 設定 / 編集 / パスワード変更を出す。
 * ヘッダの「マイページ」もこの画面（`/users/:userId`）を指す。
 */
import { useState } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import type { AuthenticatedOutletContext } from "../../routes/ProtectedRoute";
import Layout from "../../components/Layout";
import UserAvatar from "../../components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useUserQuery } from "../../queries/useUser";
import PushSettingsCard from "../push/PushSettingsCard";
import ChangePasswordModal from "./ChangePasswordModal";
import EditProfileModal from "./EditProfileModal";

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
        <Button variant="default" nativeButton={false} render={<Link to="/" />}>
          ホームに戻る
        </Button>
        {isSelf ? <h2 className="mt-2 text-xl font-bold">マイページ</h2> : null}
      </div>

      <div className="flex flex-col gap-6">
        {isSelf ? <PushSettingsCard /> : null}

        {!isSelf && isLoading && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-4">
              <Skeleton className="size-20 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardHeader>
          </Card>
        )}

        {!isSelf && isError && (
          <ErrorMessage>ユーザー情報の取得に失敗しました。</ErrorMessage>
        )}

        {profile && (
          <Card>
            <CardHeader>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <UserAvatar avatarKey={profile.avatarKey} className="size-20" />
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-lg">
                    {profile.displayName}
                  </CardTitle>
                  {profile.bio ? (
                    <p className="text-muted-foreground mt-2 text-sm whitespace-pre-wrap">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-muted-foreground mt-2 text-sm">
                      自己紹介は未設定です
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            {isSelf && (
              <>
                <Separator />
                <CardFooter className="justify-start gap-2 border-0 bg-transparent">
                  <Button variant="outline" onClick={() => setEditOpen(true)}>
                    編集
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPasswordOpen(true)}
                  >
                    パスワード変更
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        )}
      </div>

      {isSelf && editOpen && (
        <EditProfileModal
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
