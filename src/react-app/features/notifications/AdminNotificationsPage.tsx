/**
 * 管理者向けアプリ内通知の作成・有効切替・削除画面。
 */
import { useState, type FormEvent } from "react";
import { Link, useOutletContext } from "react-router";
import { Bell } from "lucide-react";
import type { AuthenticatedOutletContext } from "../../routes/ProtectedRoute";
import Layout from "../../components/Layout";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
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
  FieldDescription,
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

function createFormErrorMessage(
  parsed: ReturnType<typeof CreateInAppNotificationRequestSchema.safeParse>,
): string {
  if (parsed.success) return "";
  const paths = parsed.error.issues.map((issue) => issue.path[0]);
  if (paths.includes("linkUrl")) {
    return "http(s) の URL を入力してください。";
  }
  if (paths.includes("linkLabel")) {
    return "リンク URL を入力するか、リンクラベルを空にしてください。";
  }
  return "タイトルと本文を入力してください。";
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
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
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
      linkUrl: linkUrl || undefined,
      linkLabel: linkLabel || undefined,
    });
    if (!parsed.success) {
      setFormError(createFormErrorMessage(parsed));
      return;
    }
    setFormError(null);
    createMutation.mutate(parsed.data, {
      onSuccess: () => {
        setTitle("");
        setBody("");
        setLinkUrl("");
        setLinkLabel("");
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
        <Button variant="default" nativeButton={false} render={<Link to="/" />}>
          ホームに戻る
        </Button>
        <h2 className="mt-2 text-xl font-bold">通知管理</h2>
        <p className="text-muted-foreground mt-1 text-sm">
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
                <Field data-invalid={formError ? true : undefined}>
                  <FieldLabel htmlFor="admin-notification-link-url">
                    リンク URL（任意）
                  </FieldLabel>
                  <Input
                    id="admin-notification-link-url"
                    type="url"
                    value={linkUrl}
                    onChange={(event) => setLinkUrl(event.target.value)}
                    maxLength={2048}
                    placeholder="https://example.com"
                    aria-invalid={formError ? true : undefined}
                  />
                  <FieldDescription>
                    http または https の URL のみ指定できます。
                  </FieldDescription>
                </Field>
                <Field data-invalid={formError ? true : undefined}>
                  <FieldLabel htmlFor="admin-notification-link-label">
                    リンクラベル（任意）
                  </FieldLabel>
                  <Input
                    id="admin-notification-link-label"
                    value={linkLabel}
                    onChange={(event) => setLinkLabel(event.target.value)}
                    maxLength={100}
                    placeholder="詳細を見る"
                    aria-invalid={formError ? true : undefined}
                  />
                  <FieldDescription>
                    未入力の場合、ユーザーには「詳細を見る」と表示されます。
                  </FieldDescription>
                </Field>
                <Button type="submit" disabled={createMutation.isPending}>
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
                    <TableHead>リンク</TableHead>
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
                      <TableCell className="text-muted-foreground max-w-40 truncate">
                        {item.linkUrl ?? "—"}
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
                          variant="destructive"
                          size="xs"
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
