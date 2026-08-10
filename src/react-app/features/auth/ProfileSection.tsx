/**
 * マイページのプロフィール編集セクション（表示名・自己紹介・アバター）。
 */
import { useState, type FormEvent } from "react";
import {
  AVATAR_KEYS,
  getAvatarUrl,
  type AvatarKey,
} from "../../../../shared/schemas";
import Button from "../../components/ui/Button";
import { TextAreaField, TextField } from "../../components/ui/FormField";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useUpdateProfileMutation } from "../../queries/useAuth";
import { ApiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import {
  sectionClassName,
  sectionTitleClassName,
  successClassName,
} from "./mypageStyles";

const avatarButtonBaseClassName =
  "rounded-full ring-2 ring-offset-2 transition focus:outline-none focus-visible:ring-indigo-500";

function profileErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "入力内容を確認してください。";
  }
  return "プロフィールの更新に失敗しました。しばらくしてから再度お試しください。";
}

interface ProfileSectionProps {
  initialDisplayName: string;
  initialBio: string;
  initialAvatarKey: AvatarKey | null;
}

export default function ProfileSection({
  initialDisplayName,
  initialBio,
  initialAvatarKey,
}: ProfileSectionProps) {
  const updateProfileMutation = useUpdateProfileMutation();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarKey, setAvatarKey] = useState<AvatarKey | null>(
    initialAvatarKey,
  );
  const [profileFormError, setProfileFormError] = useState<string | null>(null);

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
          {updateProfileMutation.isPending ? "保存中..." : "プロフィールを保存"}
        </Button>
      </form>
    </section>
  );
}
