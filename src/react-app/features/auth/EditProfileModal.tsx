/**
 * プロフィール編集モーダル（アバター・表示名・自己紹介）。
 */
import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { AVATAR_KEYS, type AvatarKey } from "../../../../shared/schemas";
import Button from "../../components/ui/Button";
import UserAvatar from "../../components/UserAvatar";
import { TextAreaField, TextField } from "../../components/ui/FormField";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useUpdateProfileMutation } from "../../queries/useAuth";
import { ApiError } from "../../lib/api";
import { cn } from "../../lib/cn";

const overlayClassName =
  "fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center";
const panelClassName =
  "max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6";
const avatarButtonBaseClassName =
  "cursor-pointer rounded-full ring-2 ring-offset-2 transition focus:outline-none focus-visible:ring-indigo-500";
const closeButtonClassName =
  "cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600";

function profileErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "入力内容を確認してください。";
  }
  return "プロフィールの更新に失敗しました。しばらくしてから再度お試しください。";
}

interface EditProfileModalProps {
  initialDisplayName: string;
  initialBio: string;
  initialAvatarKey: AvatarKey | null;
  onClose: () => void;
}

export default function EditProfileModal({
  initialDisplayName,
  initialBio,
  initialAvatarKey,
  onClose,
}: EditProfileModalProps) {
  const updateProfileMutation = useUpdateProfileMutation();
  const { reset: resetUpdateProfile } = updateProfileMutation;
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [avatarKey, setAvatarKey] = useState<AvatarKey | null>(
    initialAvatarKey,
  );
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  // 前回オープン時の isSuccess / isError が残らないようにする
  useEffect(() => {
    resetUpdateProfile();
  }, [resetUpdateProfile]);

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayNameError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setDisplayNameError("表示名を入力してください。");
      return;
    }

    updateProfileMutation.mutate(
      {
        displayName: trimmedName,
        bio: bio.trim() ? bio.trim() : null,
        avatarKey,
      },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <div className={overlayClassName} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-profile-title"
        onClick={(e) => e.stopPropagation()}
        className={panelClassName}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="edit-profile-title"
            className="text-lg font-bold text-gray-900"
          >
            プロフィールを編集
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={closeButtonClassName}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">アバター</p>
            <div className="mb-3 flex items-center gap-3">
              <UserAvatar
                avatarKey={avatarKey}
                alt="選択中のアバター"
                className="h-16 w-16"
              />
              <button
                type="button"
                onClick={() => setAvatarKey(null)}
                className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 hover:underline"
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
                    <UserAvatar avatarKey={key} className="h-12 w-12" />
                  </button>
                );
              })}
            </div>
          </div>

          <TextField
            id="edit-displayName"
            label="表示名"
            required
            maxLength={50}
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (displayNameError) setDisplayNameError(null);
            }}
            autoComplete="nickname"
            error={Boolean(displayNameError)}
            errorMessage={displayNameError ?? undefined}
          />

          <TextAreaField
            id="edit-bio"
            label="自己紹介"
            rows={4}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="好きな学習分野や目標など"
          />

          {updateProfileMutation.isError && (
            <ErrorMessage>
              {profileErrorMessage(updateProfileMutation.error)}
            </ErrorMessage>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 py-2.5"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="flex-1 py-2.5"
            >
              {updateProfileMutation.isPending ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
