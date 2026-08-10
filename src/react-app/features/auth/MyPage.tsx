/**
 * マイページ（プロフィール編集・アバター選択・パスワード変更）。
 */
import { useState, type FormEvent } from "react";
import { Link, useOutletContext } from "react-router";
import {
  AVATAR_KEYS,
  getAvatarUrl,
  type AvatarKey,
} from "../../../../shared/schemas";
import type { AuthenticatedOutletContext } from "../../routes/ProtectedRoute";
import Layout from "../../components/Layout";
import Button from "../../components/ui/Button";
import { TextAreaField, TextField } from "../../components/ui/FormField";
import ErrorMessage from "../../components/ui/ErrorMessage";
import {
  useChangePasswordMutation,
  useUpdateProfileMutation,
} from "../../queries/useAuth";
import { ApiError } from "../../lib/api";
import { cn } from "../../lib/cn";

const sectionClassName =
  "rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6";
const sectionTitleClassName = "mb-4 text-base font-bold text-gray-900";
const successClassName =
  "rounded-md bg-green-50 px-3 py-2 text-sm text-green-700";
const avatarButtonBaseClassName =
  "rounded-full ring-2 ring-offset-2 transition focus:outline-none focus-visible:ring-indigo-500";

function profileErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "入力内容を確認してください。";
  }
  return "プロフィールの更新に失敗しました。しばらくしてから再度お試しください。";
}

function passwordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return "現在のパスワードが正しくありません。";
    if (error.status === 400)
      return "新しいパスワードは8文字以上で入力してください。";
  }
  return "パスワードの変更に失敗しました。しばらくしてから再度お試しください。";
}

function ProfileSection({
  initialDisplayName,
  initialBio,
  initialAvatarKey,
}: {
  initialDisplayName: string;
  initialBio: string;
  initialAvatarKey: AvatarKey | null;
}) {
  const updateProfileMutation = useUpdateProfileMutation();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarKey, setAvatarKey] = useState<AvatarKey | null>(
    initialAvatarKey,
  );
  const [profileFormError, setProfileFormError] = useState<string | null>(
    null,
  );

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileFormError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setProfileFormError("表示名を入力してください。");
      return;
    }

    updateProfileMutation.mutate({
      displayName: trimmedName,
      bio: bio.trim() ? bio.trim() : null,
      avatarKey,
    });
  };

  return (
    <section className={sectionClassName}>
      <h3 className={sectionTitleClassName}>プロフィール</h3>
      <form onSubmit={handleProfileSubmit} className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">アバター</p>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={getAvatarUrl(avatarKey)}
              alt="選択中のアバター"
              className="h-16 w-16 rounded-full"
              width={64}
              height={64}
            />
            <button
              type="button"
              onClick={() => setAvatarKey(null)}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              デフォルトに戻す
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {AVATAR_KEYS.map((key) => {
              const selected = avatarKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAvatarKey(key)}
                  aria-label={`アバター ${key}`}
                  aria-pressed={selected}
                  className={cn(
                    avatarButtonBaseClassName,
                    selected
                      ? "ring-indigo-600"
                      : "ring-transparent hover:ring-gray-300",
                  )}
                >
                  <img
                    src={getAvatarUrl(key)}
                    alt=""
                    className="h-12 w-12 rounded-full"
                    width={48}
                    height={48}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <TextField
          id="displayName"
          label="表示名"
          required
          maxLength={50}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoComplete="nickname"
        />

        <TextAreaField
          id="bio"
          label="自己紹介"
          rows={4}
          maxLength={500}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="好きな学習分野や目標など（任意）"
        />

        {(profileFormError || updateProfileMutation.isError) && (
          <ErrorMessage>
            {profileFormError ??
              profileErrorMessage(updateProfileMutation.error)}
          </ErrorMessage>
        )}
        {!profileFormError && updateProfileMutation.isSuccess && (
          <p className={successClassName}>プロフィールを保存しました。</p>
        )}

        <Button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="px-4 py-2 text-sm"
        >
          {updateProfileMutation.isPending
            ? "保存中..."
            : "プロフィールを保存"}
        </Button>
      </form>
    </section>
  );
}

function PasswordSection() {
  const changePasswordMutation = useChangePasswordMutation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFormError, setPasswordFormError] = useState<string | null>(
    null,
  );

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFormError(null);

    if (newPassword !== confirmPassword) {
      setPasswordFormError("新しいパスワード（確認）が一致しません。");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordFormError("新しいパスワードは8文字以上で入力してください。");
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        },
      },
    );
  };

  return (
    <section className={sectionClassName}>
      <h3 className={sectionTitleClassName}>パスワード変更</h3>
      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        <TextField
          id="currentPassword"
          label="現在のパスワード"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <TextField
          id="newPassword"
          label="新しいパスワード"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="8文字以上"
        />
        <TextField
          id="confirmPassword"
          label="新しいパスワード（確認）"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {(passwordFormError || changePasswordMutation.isError) && (
          <ErrorMessage>
            {passwordFormError ??
              passwordErrorMessage(changePasswordMutation.error)}
          </ErrorMessage>
        )}
        {changePasswordMutation.isSuccess && !passwordFormError && (
          <p className={successClassName}>パスワードを変更しました。</p>
        )}

        <Button
          type="submit"
          disabled={changePasswordMutation.isPending}
          className="px-4 py-2 text-sm"
        >
          {changePasswordMutation.isPending
            ? "変更中..."
            : "パスワードを変更"}
        </Button>
      </form>
    </section>
  );
}

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
