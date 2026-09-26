/**
 * ログインフォーム。画面の枠とテーマ切替は `pages/LoginPage` が持つ。
 */
import { useState, type FormEvent } from "react";
import { LoginRequestSchema } from "../../../../shared/schemas";
import { useLoginMutation } from "./api/useAuth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import ErrorMessage from "@/components/ui/ErrorMessage";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return "メールアドレスまたはパスワードが正しくありません。";
    if (error.status === 400) return "入力内容を確認してください。";
  }
  return "ログインに失敗しました。しばらくしてから再度お試しください。";
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const loginMutation = useLoginMutation();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = LoginRequestSchema.safeParse({ email, password });
    if (!parsed.success) {
      setClientError("入力内容を確認してください。");
      return;
    }
    setClientError(null);
    loginMutation.mutate(parsed.data);
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <h1 className="font-heading text-2xl font-medium">学習記録シェア</h1>
        <CardDescription>グループの学習記録を共有しよう</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email" required>
                メールアドレス
              </FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="password" required>
                パスワード
              </FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {(clientError || loginMutation.isError) && (
              <ErrorMessage>
                {clientError ?? loginErrorMessage(loginMutation.error)}
              </ErrorMessage>
            )}

            <Field>
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full"
              >
                {loginMutation.isPending ? (
                  <>
                    <Spinner data-icon="inline-start" />
                    ログイン中...
                  </>
                ) : (
                  "ログイン"
                )}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
