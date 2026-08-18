/**
 * 管理者向けのグループ追加・ユーザー追加・所属の編集画面。
 */
import { useState, type FormEvent } from "react";
import { Link, useOutletContext } from "react-router";
import { Users } from "lucide-react";
import type { AuthenticatedOutletContext } from "../../routes/ProtectedRoute";
import Layout from "../../components/Layout";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "../../components/ui/native-select";
import { Spinner } from "../../components/ui/spinner";
import { useConfirm } from "../../components/useConfirm";
import { ApiError } from "../../lib/api";
import {
  useAddGroupMemberMutation,
  useAdminGroupsQuery,
  useAdminUsersQuery,
  useCreateAdminGroupMutation,
  useCreateAdminUserMutation,
  useRemoveGroupMemberMutation,
} from "../../queries/useAdminDirectory";
import {
  CreateAdminGroupRequestSchema,
  CreateAdminUserRequestSchema,
} from "../../../../shared/schemas";

function mutationErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 400) return "入力内容を確認してください。";
    if (error.status === 403) return "管理者のみ操作できます。";
    if (error.status === 404) {
      if (error.message === "not_member") {
        return "このユーザーは所属していません。";
      }
      return "対象が見つかりません。";
    }
    if (error.status === 409) {
      if (error.message === "email_taken") {
        return "このメールアドレスは既に使われています。";
      }
      if (error.message === "already_member") {
        return "既に所属しています。";
      }
    }
  }
  return "操作に失敗しました。しばらくしてから再度お試しください。";
}

export default function AdminDirectoryPage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();
  const confirm = useConfirm();
  const usersQuery = useAdminUsersQuery(true);
  const groupsQuery = useAdminGroupsQuery(true);
  const createGroupMutation = useCreateAdminGroupMutation();
  const createUserMutation = useCreateAdminUserMutation();
  const addMemberMutation = useAddGroupMemberMutation();
  const removeMemberMutation = useRemoveGroupMemberMutation();

  const [groupName, setGroupName] = useState("");
  const [groupFormError, setGroupFormError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  const users = usersQuery.data?.users ?? [];
  const groups = groupsQuery.data?.groups ?? [];
  const effectiveGroupId = groups.some((group) => group.id === selectedGroupId)
    ? selectedGroupId
    : (groups[0]?.id ?? "");
  const selectedGroup = groups.find((group) => group.id === effectiveGroupId);
  const memberIds = new Set(
    (selectedGroup?.members ?? []).map((member) => member.id),
  );
  const nonMembers = users.filter((candidate) => !memberIds.has(candidate.id));

  const handleCreateGroup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = CreateAdminGroupRequestSchema.safeParse({ name: groupName });
    if (!parsed.success) {
      setGroupFormError("グループ名を入力してください。");
      return;
    }
    setGroupFormError(null);
    createGroupMutation.mutate(parsed.data, {
      onSuccess: (result) => {
        setGroupName("");
        setSelectedGroupId(result.group.id);
        setSelectedUserId("");
      },
    });
  };

  const handleCreateUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = CreateAdminUserRequestSchema.safeParse({
      email,
      password,
      displayName,
    });
    if (!parsed.success) {
      setUserFormError(
        "メールアドレス・表示名・8文字以上のパスワードを入力してください。",
      );
      return;
    }
    setUserFormError(null);
    createUserMutation.mutate(parsed.data, {
      onSuccess: () => {
        setEmail("");
        setDisplayName("");
        setPassword("");
      },
    });
  };

  const handleAddMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveGroupId || !selectedUserId) return;
    addMemberMutation.mutate(
      { groupId: effectiveGroupId, userId: selectedUserId },
      {
        onSuccess: () => {
          setSelectedUserId("");
        },
      },
    );
  };

  const handleRemoveMember = async (
    userId: string,
    memberName: string,
    groupNameLabel: string,
  ) => {
    const ok = await confirm({
      title: "所属を解除",
      message: `「${memberName}」を「${groupNameLabel}」から外しますか？`,
      confirmLabel: "削除",
      variant: "danger",
    });
    if (!ok) return;
    removeMemberMutation.mutate({ groupId: effectiveGroupId, userId });
  };

  const actionError =
    createGroupMutation.error ??
    createUserMutation.error ??
    addMemberMutation.error ??
    removeMemberMutation.error;
  const directoryLoading = usersQuery.isLoading || groupsQuery.isLoading;
  const directoryError = usersQuery.isError || groupsQuery.isError;
  const removingUserId = removeMemberMutation.isPending
    ? removeMemberMutation.variables?.userId
    : undefined;

  return (
    <Layout user={user}>
      <div className="mb-4">
        <Button variant="default" nativeButton={false} render={<Link to="/" />}>
          ホームに戻る
        </Button>
        <h2 className="mt-2 text-xl font-bold">グループユーザー管理</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          グループとユーザーの追加、グループへの所属の追加・削除ができます。公開の自己登録はありません。
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>グループを追加</CardTitle>
            <CardDescription>
              新しいグループを作成します。作成直後はメンバーがいません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGroup}>
              <FieldGroup>
                <Field data-invalid={groupFormError ? true : undefined}>
                  <FieldLabel htmlFor="admin-group-name">グループ名</FieldLabel>
                  <Input
                    id="admin-group-name"
                    value={groupName}
                    onChange={(event) => setGroupName(event.target.value)}
                    maxLength={100}
                    required
                    aria-invalid={groupFormError ? true : undefined}
                  />
                  {groupFormError ? (
                    <FieldError>{groupFormError}</FieldError>
                  ) : null}
                </Field>
                <Button type="submit" disabled={createGroupMutation.isPending}>
                  {createGroupMutation.isPending ? (
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

        <Card>
          <CardHeader>
            <CardTitle>ユーザーを追加</CardTitle>
            <CardDescription>
              一般ユーザー（USER）を作成します。管理者の作成はできません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser}>
              <FieldGroup>
                <Field data-invalid={userFormError ? true : undefined}>
                  <FieldLabel htmlFor="admin-user-email">
                    メールアドレス
                  </FieldLabel>
                  <Input
                    id="admin-user-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="off"
                    aria-invalid={userFormError ? true : undefined}
                  />
                </Field>
                <Field data-invalid={userFormError ? true : undefined}>
                  <FieldLabel htmlFor="admin-user-display-name">
                    表示名
                  </FieldLabel>
                  <Input
                    id="admin-user-display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={50}
                    required
                    aria-invalid={userFormError ? true : undefined}
                  />
                </Field>
                <Field data-invalid={userFormError ? true : undefined}>
                  <FieldLabel htmlFor="admin-user-password">
                    パスワード
                  </FieldLabel>
                  <Input
                    id="admin-user-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={8}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                    aria-invalid={userFormError ? true : undefined}
                  />
                  {userFormError ? (
                    <FieldError>{userFormError}</FieldError>
                  ) : null}
                </Field>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
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
            <CardTitle>所属の編集</CardTitle>
            <CardDescription>
              グループを選び、メンバーの追加と削除ができます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            {directoryLoading ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : directoryError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  グループまたはユーザーの取得に失敗しました。
                </AlertDescription>
              </Alert>
            ) : groups.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>グループはまだありません</EmptyTitle>
                  <EmptyDescription>
                    上のフォームから最初のグループを追加してください。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="flex flex-col gap-5">
                <Field>
                  <FieldLabel htmlFor="admin-group-select">グループ</FieldLabel>
                  <NativeSelect
                    id="admin-group-select"
                    className="w-full"
                    value={effectiveGroupId}
                    onChange={(event) => {
                      setSelectedGroupId(event.target.value);
                      setSelectedUserId("");
                    }}
                  >
                    {groups.map((group) => (
                      <NativeSelectOption key={group.id} value={group.id}>
                        {group.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>

                {selectedGroup && selectedGroup.members.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Users />
                      </EmptyMedia>
                      <EmptyTitle>メンバーはいません</EmptyTitle>
                      <EmptyDescription>
                        下の選択からユーザーを追加してください。
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {(selectedGroup?.members ?? []).map((member) => (
                      <li
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {member.displayName}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {member.email}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={
                              member.role === "ADMIN" ? "default" : "secondary"
                            }
                          >
                            {member.role}
                          </Badge>
                          <Button
                            variant="destructive"
                            size="xs"
                            disabled={removingUserId === member.id}
                            onClick={() => {
                              void handleRemoveMember(
                                member.id,
                                member.displayName,
                                selectedGroup?.name ?? "",
                              );
                            }}
                          >
                            削除
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {nonMembers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    追加できるユーザーはいません。
                  </p>
                ) : (
                  <form onSubmit={handleAddMember}>
                    <FieldGroup>
                      <Field>
                        <FieldLabel htmlFor="admin-member-user">
                          未所属のユーザー
                        </FieldLabel>
                        <NativeSelect
                          id="admin-member-user"
                          className="w-full"
                          value={selectedUserId}
                          onChange={(event) =>
                            setSelectedUserId(event.target.value)
                          }
                          required
                        >
                          <NativeSelectOption value="">
                            ユーザーを選択
                          </NativeSelectOption>
                          {nonMembers.map((candidate) => (
                            <NativeSelectOption
                              key={candidate.id}
                              value={candidate.id}
                            >
                              {candidate.displayName}（{candidate.email}）
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                      </Field>
                      <Button
                        type="submit"
                        disabled={
                          addMemberMutation.isPending || selectedUserId === ""
                        }
                      >
                        {addMemberMutation.isPending ? (
                          <>
                            <Spinner data-icon="inline-start" />
                            追加中…
                          </>
                        ) : (
                          "所属を追加"
                        )}
                      </Button>
                    </FieldGroup>
                  </form>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
