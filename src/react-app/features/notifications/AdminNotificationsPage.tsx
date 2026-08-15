/**
 * 管理者向けアプリ内通知の作成・有効切替・削除画面。
 */
import { useState, type FormEvent } from "react";
import { Link, useOutletContext } from "react-router";
import { Bell } from "lucide-react";
import type { AuthenticatedOutletContext } from "../../routes/ProtectedRoute";
import Layout from "../../components/Layout";
import Button from "../../components/ui/Button";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../../components/ui/empty";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../components/ui/field";
import { Input } from "../../components/ui/input";
import { Spinner } from "../../components/ui/spinner";
import { Switch } from "../../components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Textarea } from "../../components/ui/textarea";
import { useConfirm } from "../../components/useConfirm";
import {
  useAdminNotificationsQuery,
  useCreateNotificationMutation,
  useDeleteNotificationMutation,
  useToggleNotificationMutation,
} from "../../queries/useNotifications";
import { ApiError } from "../../lib/api";
import { CreateInAppNotificationRequestSchema } from "../../../../shared/schemas";

function mutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "入力内容を確認してください。";
    if (error.status === 403) return "管理者のみ操作できます。";
    if (error.status === 404) return "通知が見つかりません。";
  }
  return "操作に失敗しました。しばらくしてから再度お試しください。";
}

export default function AdminNotificationsPage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();
  const confirm = useConfirm();
  const listQuery = useAdminNotificationsQuery(true);
  const createMutation = useCreateNotificationMutation();
  const toggleMutation = useToggleNotificationMutation();
  const deleteMutation = useDeleteNotificationMutation();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const notifications = listQuery.data?.notifications ?? [];
  const pendingId =
    toggleMutation.isPending || deleteMutation.isPending
      ? (toggleMutation.variables?.id ?? deleteMutation.variables)
      : undefined;

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = CreateInAppNotificationRequestSchema.safeParse({
      title,
      body,
    });
    if (!parsed.success) {
      setFormError("タイトルと本文を入力してください。");
      return;
    }
    setFormError(null);
    createMutation.mutate(parsed.data, {
      onSuccess: () => {
        setTitle("");
        setBody("");
      },
    });
  };

  const handleToggle = (id: string, enabled: boolean) => {
    toggleMutation.mutate({ id, enabled });
  };

  const handleDelete = async (id: string, notificationTitle: string) => {
    const ok = await confirm({
      title: "通知を削除",
      message: `「${notificationTitle}」を削除しますか？この操作は取り消せません。`,
      confirmLabel: "削除",
      variant: "danger",
    });
    if (!ok) return;
    deleteMutation.mutate(id);
  };

  const actionError =
    createMutation.error ?? toggleMutation.error ?? deleteMutation.error;

  return (
    <Layout user={user}>
      <div className="mb-4">
        <Link
          to="/"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          ← ホームに戻る
        </Link>
        <h2 className="mt-2 text-xl font-bold text-gray-900">通知管理</h2>
        <p className="mt-1 text-sm text-gray-600">
          アプリ内通知の作成・有効/無効・削除ができます。有効な通知は全ユーザーの通知一覧に表示されます。
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>新しい通知</CardTitle>
            <CardDescription>
              タイトルと本文を入力して追加します。追加直後は有効です。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate}>
              <FieldGroup>
                <Field data-invalid={formError ? true : undefined}>
                  <FieldLabel htmlFor="admin-notification-title">
                    タイトル
                  </FieldLabel>
                  <Input
                    id="admin-notification-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    maxLength={200}
                    required
                    aria-invalid={formError ? true : undefined}
                  />
                </Field>
                <Field data-invalid={formError ? true : undefined}>
                  <FieldLabel htmlFor="admin-notification-body">
                    本文
                  </FieldLabel>
                  <Textarea
                    id="admin-notification-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    maxLength={2000}
                    required
                    rows={4}
                    aria-invalid={formError ? true : undefined}
                  />
                  {formError ? <FieldError>{formError}</FieldError> : null}
                </Field>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Spinner data-icon="inline-start" />
                      追加中…
                    </>
                  ) : (
                    "追加"
                  )}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        {actionError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {mutationErrorMessage(actionError)}
            </AlertDescription>
          </Alert>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>通知一覧</CardTitle>
            <CardDescription>
              無効にするとユーザーの通知一覧から外れます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {listQuery.isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : listQuery.isError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  通知一覧の取得に失敗しました。
                </AlertDescription>
              </Alert>
            ) : notifications.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Bell />
                  </EmptyMedia>
                  <EmptyTitle>通知はまだありません</EmptyTitle>
                  <EmptyDescription>
                    上のフォームから最初のアプリ内通知を追加してください。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>タイトル</TableHead>
                    <TableHead>本文</TableHead>
                    <TableHead>状態</TableHead>
                    <TableHead>有効</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-40 truncate font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-56 truncate">
                        {item.body}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.enabled ? "default" : "secondary"}>
                          {item.enabled ? "有効" : "無効"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.enabled}
                          disabled={pendingId === item.id}
                          onCheckedChange={(checked) =>
                            handleToggle(item.id, checked)
                          }
                          aria-label={`「${item.title}」を${item.enabled ? "無効" : "有効"}にする`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="danger"
                          className="px-3 py-1.5 text-xs"
                          disabled={pendingId === item.id}
                          onClick={() => {
                            void handleDelete(item.id, item.title);
                          }}
                        >
                          削除
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
