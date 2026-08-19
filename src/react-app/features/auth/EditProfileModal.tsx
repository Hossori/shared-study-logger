/**
 * プロフィール編集モーダル（アバター・表示名・自己紹介）。
 */
import { useEffect, useState, type FormEvent } from "react";
import { AVATAR_KEYS, type AvatarKey } from "../../../../shared/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogButtonArea,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import UserAvatar from "../../components/UserAvatar";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useUnsavedCloseGuard } from "../../components/useUnsavedCloseGuard";
import { useUpdateProfileMutation } from "../../queries/useAuth";
import { ApiError } from "../../lib/api";
import { cn } from "@/lib/utils";

function profileErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "入力内容を確認してください。";
  }
  return "プロフィールの更新に失敗しました。しばらくしてから再度お試しください。";
}

interface EditProfileModalProps {
  open: boolean;
  initialDisplayName: string;
  initialBio: string;
  initialAvatarKey: AvatarKey | null;
  onClose: () => void;
}

export default function EditProfileModal({
  open,
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
  const {
    requestClose,
    handleOpenChange,
    formGuardProps,
    confirmNode,
    markDirty,
  } = useUnsavedCloseGuard(open, onClose);

  // 前回オープン時の isSuccess / isError が残らないようにする
  useEffect(() => {
    resetUpdateProfile();
  }, [resetUpdateProfile]);

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDisplayNameError(null);
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setDisplayNameError("表示名を入力してください。");
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        displayName: trimmedName,
        bio: bio.trim() ? bio.trim() : null,
        avatarKey,
      });
      onClose();
    } catch {
      // エラーメッセージは mutation.isError から表示する
    }
  };

  const displayNameInvalid = Boolean(displayNameError);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-labelledby="edit-profile-title"
      >
        <form
          onSubmit={handleProfileSubmit}
          className="contents"
          {...formGuardProps}
        >
          <DialogHeader>
            <DialogTitle id="edit-profile-title">
              プロフィールを編集
            </DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <FieldSet>
              <FieldLegend variant="label">アバター</FieldLegend>
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarKey={avatarKey}
                  alt="選択中のアバター"
                  className="size-16"
                />
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    markDirty();
                    setAvatarKey(null);
                  }}
                >
                  デフォルトに戻す
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                {AVATAR_KEYS.map((key) => {
                  const selected = avatarKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        markDirty();
                        setAvatarKey(key);
                      }}
                      aria-label={`アバター ${key}`}
                      aria-pressed={selected}
                      className={cn(
                        "focus-visible:ring-ring cursor-pointer rounded-full ring-2 ring-offset-2 transition focus:outline-none",
                        selected
                          ? "ring-primary"
                          : "hover:ring-border ring-transparent",
                      )}
                    >
                      <UserAvatar avatarKey={key} className="size-12" />
                    </button>
                  );
                })}
              </div>
            </FieldSet>

            <Field data-invalid={displayNameInvalid || undefined}>
              <FieldLabel htmlFor="edit-displayName">表示名</FieldLabel>
              <Input
                id="edit-displayName"
                required
                maxLength={50}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (displayNameError) setDisplayNameError(null);
                }}
                autoComplete="nickname"
                aria-invalid={displayNameInvalid || undefined}
                aria-describedby={
                  displayNameError ? "edit-displayName-error" : undefined
                }
              />
              <FieldError id="edit-displayName-error">
                {displayNameError}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-bio">自己紹介</FieldLabel>
              <Textarea
                id="edit-bio"
                rows={4}
                maxLength={500}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="好きな学習分野や目標など"
                className="resize-none"
              />
            </Field>

            {updateProfileMutation.isError && (
              <ErrorMessage>
                {profileErrorMessage(updateProfileMutation.error)}
              </ErrorMessage>
            )}
          </FieldGroup>

          <DialogButtonArea>
            <Button type="button" variant="outline" onClick={requestClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogButtonArea>
        </form>
      </DialogContent>
      {confirmNode}
    </Dialog>
  );
}
