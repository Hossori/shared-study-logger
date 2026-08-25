/**
 * ログイン画面（email/passwordフォーム）。
 */
import { useState, type FormEvent } from "react";
import { useLoginMutation } from "../../queries/useAuth";
import { ApiError } from "../../lib/api";
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
import ErrorMessage from "../../components/ui/ErrorMessage";
import ThemeToggle from "../../components/ThemeToggle";

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return "メールアドレスまたはパスワードが正しくありません。";
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
    <div className="bg-background flex min-h-dvh items-center justify-center pt-[max(1rem,var(--safe-area-inset-top))] pr-[max(1rem,var(--safe-area-inset-right))] pb-[max(1rem,var(--safe-area-inset-bottom))] pl-[max(1rem,var(--safe-area-inset-left))]">
      <div className="fixed top-[max(0.75rem,var(--safe-area-inset-top))] right-[max(0.75rem,var(--safe-area-inset-right))] z-20">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="font-heading text-2xl font-medium">学習記録シェア</h1>
          <CardDescription>グループの学習記録を共有しよう</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">メールアドレス</FieldLabel>
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
                <FieldLabel htmlFor="password">パスワード</FieldLabel>
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

              {loginMutation.isError && (
                <ErrorMessage>
                  {loginErrorMessage(loginMutation.error)}
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
    </div>
  );
}
