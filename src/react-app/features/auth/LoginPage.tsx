/**
 * ログイン画面（email/passwordフォーム）。
 */
import { useState, type FormEvent } from "react";
import { useLoginMutation } from "../../queries/useAuth";
import { ApiError } from "../../lib/api";
import Button from "../../components/ui/Button";
import { TextField } from "../../components/ui/FormField";
import ErrorMessage from "../../components/ui/ErrorMessage";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "メールアドレスまたはパスワードが正しくありません。";
    if (error.status === 400) return "入力内容を確認してください。";
  }
  return "ログインに失敗しました。しばらくしてから再度お試しください。";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLoginMutation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-2xl font-bold text-gray-900">
          学習記録シェア
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          グループの学習記録を共有しよう
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            id="email"
            label="メールアドレス"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <TextField
            id="password"
            label="パスワード"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {loginMutation.isError && (
            <ErrorMessage>{loginErrorMessage(loginMutation.error)}</ErrorMessage>
          )}

          <Button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full py-2.5"
          >
            {loginMutation.isPending ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
      </div>
    </div>
  );
}
