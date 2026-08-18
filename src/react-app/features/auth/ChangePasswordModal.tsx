/**
 * パスワード変更モーダル。
 */
import { useEffect, useState, type FormEvent } from "react";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useChangePasswordMutation } from "../../queries/useAuth";
import { ApiError } from "../../lib/api";

function passwordApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "現在のパスワードが正しくありません。";
    if (error.status === 400)
      return "新しいパスワードは8文字以上で入力してください。";
  }
  return "パスワードの変更に失敗しました。しばらくしてから再度お試しください。";
}

type PasswordFieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

interface ChangePasswordModalProps {
  onClose: () => void;
}

export default function ChangePasswordModal({
  onClose,
}: ChangePasswordModalProps) {
  const changePasswordMutation = useChangePasswordMutation();
  const { reset: resetChangePassword } = changePasswordMutation;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<PasswordFieldErrors>({});

  // 前回オープン時の isError が残らないようにする
  useEffect(() => {
    resetChangePassword();
  }, [resetChangePassword]);

  const clearFieldError = (key: keyof PasswordFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (changePasswordMutation.isError) {
      changePasswordMutation.reset();
    }
  };

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: PasswordFieldErrors = {};

    if (newPassword.length < 8) {
      nextErrors.newPassword =
        "新しいパスワードは8文字以上で入力してください。";
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "新しいパスワード（確認）が一致しません。";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setFieldErrors({});
          onClose();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 401) {
            setFieldErrors({
              currentPassword: "現在のパスワードが正しくありません。",
            });
            return;
          }
          if (error instanceof ApiError && error.status === 400) {
            setFieldErrors({
              newPassword: "新しいパスワードは8文字以上で入力してください。",
            });
          }
        },
      },
    );
  };

  const showFormLevelApiError =
    changePasswordMutation.isError &&
    !fieldErrors.currentPassword &&
    !fieldErrors.newPassword &&
    !fieldErrors.confirmPassword;

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        aria-labelledby="change-password-title"
      >
        <form onSubmit={handlePasswordSubmit} className="contents">
          <DialogHeader>
            <DialogTitle id="change-password-title">パスワード変更</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field
              data-invalid={Boolean(fieldErrors.currentPassword) || undefined}
            >
              <FieldLabel htmlFor="modal-currentPassword">
                現在のパスワード
              </FieldLabel>
              <Input
                id="modal-currentPassword"
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  clearFieldError("currentPassword");
                }}
                aria-invalid={Boolean(fieldErrors.currentPassword) || undefined}
                aria-describedby={
                  fieldErrors.currentPassword
                    ? "modal-currentPassword-error"
                    : undefined
                }
              />
              <FieldError id="modal-currentPassword-error">
                {fieldErrors.currentPassword}
              </FieldError>
            </Field>

            <Field data-invalid={Boolean(fieldErrors.newPassword) || undefined}>
              <FieldLabel htmlFor="modal-newPassword">
                新しいパスワード
              </FieldLabel>
              <Input
                id="modal-newPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  clearFieldError("newPassword");
                }}
                placeholder="8文字以上"
                aria-invalid={Boolean(fieldErrors.newPassword) || undefined}
                aria-describedby={
                  fieldErrors.newPassword
                    ? "modal-newPassword-error"
                    : undefined
                }
              />
              <FieldError id="modal-newPassword-error">
                {fieldErrors.newPassword}
              </FieldError>
            </Field>

            <Field
              data-invalid={Boolean(fieldErrors.confirmPassword) || undefined}
            >
              <FieldLabel htmlFor="modal-confirmPassword">
                新しいパスワード（確認）
              </FieldLabel>
              <Input
                id="modal-confirmPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                aria-invalid={Boolean(fieldErrors.confirmPassword) || undefined}
                aria-describedby={
                  fieldErrors.confirmPassword
                    ? "modal-confirmPassword-error"
                    : undefined
                }
              />
              <FieldError id="modal-confirmPassword-error">
                {fieldErrors.confirmPassword}
              </FieldError>
            </Field>

            {showFormLevelApiError && (
              <ErrorMessage>
                {passwordApiErrorMessage(changePasswordMutation.error)}
              </ErrorMessage>
            )}
          </FieldGroup>

          <DialogButtonArea>
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? (
                <>
                  <Spinner data-icon="inline-start" />
                  変更中...
                </>
              ) : (
                "変更する"
              )}
            </Button>
          </DialogButtonArea>
        </form>
      </DialogContent>
    </Dialog>
  );
}
