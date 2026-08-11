/**
 * パスワード変更モーダル。
 */
import { useEffect, useState, type FormEvent } from "react";
import Button from "../../components/ui/Button";
import { TextField } from "../../components/ui/FormField";
import ErrorMessage from "../../components/ui/ErrorMessage";
import { useChangePasswordMutation } from "../../queries/useAuth";
import { ApiError } from "../../lib/api";

const overlayClassName =
  "fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center";
const panelClassName =
  "max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6";
const closeButtonClassName =
  "cursor-pointer rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600";

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
    <div className={overlayClassName} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(e) => e.stopPropagation()}
        className={panelClassName}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="change-password-title"
            className="text-lg font-bold text-gray-900"
          >
            パスワード変更
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={closeButtonClassName}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <TextField
            id="modal-currentPassword"
            label="現在のパスワード"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              clearFieldError("currentPassword");
            }}
            error={Boolean(fieldErrors.currentPassword)}
            errorMessage={fieldErrors.currentPassword}
          />
          <TextField
            id="modal-newPassword"
            label="新しいパスワード"
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
            error={Boolean(fieldErrors.newPassword)}
            errorMessage={fieldErrors.newPassword}
          />
          <TextField
            id="modal-confirmPassword"
            label="新しいパスワード（確認）"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearFieldError("confirmPassword");
            }}
            error={Boolean(fieldErrors.confirmPassword)}
            errorMessage={fieldErrors.confirmPassword}
          />

          {showFormLevelApiError && (
            <ErrorMessage>
              {passwordApiErrorMessage(changePasswordMutation.error)}
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
              disabled={changePasswordMutation.isPending}
              className="flex-1 py-2.5"
            >
              {changePasswordMutation.isPending ? "変更中..." : "変更する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
