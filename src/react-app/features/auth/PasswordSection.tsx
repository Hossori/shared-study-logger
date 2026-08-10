/**
 * マイページのパスワード変更セクション（初期は折りたたみ）。
 */
import { useId, useState, type FormEvent } from "react";
import Button from "../../components/ui/Button";
import { TextField } from "../../components/ui/FormField";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useChangePasswordMutation } from "../../queries/useAuth";
import { ApiError } from "../../lib/api";
import { cn } from "../../lib/cn";
import {
  sectionClassName,
  sectionTitleClassName,
  successClassName,
} from "./mypageStyles";

function passwordErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "現在のパスワードが正しくありません。";
    if (error.status === 400)
      return "新しいパスワードは8文字以上で入力してください。";
  }
  return "パスワードの変更に失敗しました。しばらくしてから再度お試しください。";
}

export default function PasswordSection() {
  const panelId = useId();
  const [open, setOpen] = useState(false);
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
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <h3 className={cn(sectionTitleClassName, "mb-0")}>パスワード変更</h3>
        <span className="text-sm text-gray-500" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <form
          id={panelId}
          onSubmit={handlePasswordSubmit}
          className="mt-4 space-y-4"
        >
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
      )}
    </section>
  );
}
