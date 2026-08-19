/**
 * 選択中グループの学習記録一覧（学習日時・投稿者・タイトル・メモを表示）。
 * 上部ツールバーにグループ切替と「記録を追加」（PC）。モバイル追加は Layout の FAB。
 * 「もっと見る」でカーソルページネーションの次ページを取得する。
 * 自分の記録には編集・削除操作を表示する。
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useUiStore } from "../../stores/uiStore";
import { useMeQuery } from "../../queries/useAuth";
import {
  useDeleteRecordMutation,
  useRecordsQuery,
} from "../../queries/useRecords";
import { type StudyRecord } from "../../../../shared/schemas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import UserAvatar from "../../components/UserAvatar";
import { useConfirm } from "../../components/useConfirm";
import GroupSwitcher from "../groups/GroupSwitcher";
import EditRecordModal from "./EditRecordModal";

function formatStudyDatetime(studyDatetime: string): string {
  const date = new Date(studyDatetime);
  if (Number.isNaN(date.getTime())) return studyDatetime;
  return date.toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface RecordCardProps {
  record: StudyRecord;
  isOwner: boolean;
  onEdit: (record: StudyRecord) => void;
  onDelete: (record: StudyRecord) => void;
  isDeleting: boolean;
}

function RecordCard({
  record,
  isOwner,
  onEdit,
  onDelete,
  isDeleting,
}: RecordCardProps) {
  const authorName = record.authorDisplayName ?? "不明なユーザー";

  return (
    <li>
      <Card size="sm">
        <CardHeader>
          <CardDescription>
            <Link
              to={`/users/${record.userId}`}
              className="focus-visible:ring-ring inline-flex min-w-0 shrink-0 items-center gap-1.5 rounded-full transition hover:opacity-80 focus:outline-none focus-visible:ring-2"
              aria-label={`${authorName}のユーザーページ`}
            >
              <UserAvatar
                avatarKey={record.authorAvatarKey ?? null}
                className="size-6"
              />
              <span className="truncate">{authorName}</span>
            </Link>
          </CardDescription>
          {isOwner && (
            <CardAction className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(record)}
                aria-label="編集"
                title="編集"
              >
                <Pencil aria-hidden />
                <span className="sr-only">編集</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(record)}
                disabled={isDeleting}
                aria-label="削除"
                title="削除"
              >
                <Trash2 aria-hidden />
                <span className="sr-only">削除</span>
              </Button>
            </CardAction>
          )}
          <CardDescription>
            {formatStudyDatetime(record.studyDatetime)}
          </CardDescription>
          <CardTitle>
            <h3 className="text-inherit">{record.title}</h3>
          </CardTitle>
        </CardHeader>
        {record.memo ? (
          <CardContent>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap">
              {record.memo}
            </p>
          </CardContent>
        ) : null}
      </Card>
    </li>
  );
}

function EmptyRecordsMessage() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>まだ学習記録がありません</EmptyTitle>
        <EmptyDescription className="sm:hidden">
          右下の追加ボタンから最初の記録を投稿しましょう。
        </EmptyDescription>
        <EmptyDescription className="hidden sm:block">
          「記録を追加」ボタンから最初の記録を投稿しましょう。
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function RecordsToolbar() {
  const openPostModal = useUiStore((state) => state.openPostModal);
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="min-w-0 flex-1">
        <GroupSwitcher />
      </div>
      {selectedGroupId && (
        <Button
          onClick={openPostModal}
          className="hidden shrink-0 sm:inline-flex"
        >
          <Plus data-icon="inline-start" aria-hidden />
          記録を追加
        </Button>
      )}
    </div>
  );
}

function RecordsListFrame({ children }: { children: ReactNode }) {
  return (
    <div>
      <RecordsToolbar />
      {children}
    </div>
  );
}

export default function RecordsList() {
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const { data: me } = useMeQuery();
  const {
    data,
    isPending,
    isFetching,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRecordsQuery(selectedGroupId);
  const deleteRecordMutation = useDeleteRecordMutation(selectedGroupId);
  const confirm = useConfirm();
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);
  const [editSession, setEditSession] = useState(0);

  // isLoading(= isPending && isFetching) だけだと fetch 開始前や retry 待ちで
  // isError / 空表示へ落ちるため、データ未取得中はローディングを優先する。
  const isInitialLoading = isPending || (isFetching && !data);

  const handleDelete = async (record: StudyRecord) => {
    const confirmed = await confirm({
      title: "記録の削除",
      message: `「${record.title}」を削除しますか？この操作は取り消せません。`,
      confirmLabel: "削除",
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteRecordMutation.mutateAsync(record.id);
    } catch {
      // 一覧の invalidate は onSuccess 側。失敗時は現状維持。
    }
  };

  if (!selectedGroupId) {
    return (
      <RecordsListFrame>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>グループを選択してください。</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </RecordsListFrame>
    );
  }

  if (isInitialLoading) {
    return (
      <RecordsListFrame>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </RecordsListFrame>
    );
  }

  if (isError) {
    return (
      <RecordsListFrame>
        <Empty>
          <EmptyHeader>
            <EmptyTitle>学習記録の取得に失敗しました。</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </RecordsListFrame>
    );
  }

  const records = data?.pages.flatMap((page) => page.records) ?? [];

  if (records.length === 0) {
    return (
      <RecordsListFrame>
        <EmptyRecordsMessage />
      </RecordsListFrame>
    );
  }

  return (
    <RecordsListFrame>
      <ul className="flex flex-col gap-3">
        {records.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            isOwner={me?.id === record.userId}
            onEdit={(record) => {
              setEditSession((session) => session + 1);
              setEditingRecord(record);
            }}
            onDelete={handleDelete}
            isDeleting={
              deleteRecordMutation.isPending &&
              deleteRecordMutation.variables === record.id
            }
          />
        ))}
      </ul>

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Spinner data-icon="inline-start" />
                読み込み中...
              </>
            ) : (
              "もっと見る"
            )}
          </Button>
        </div>
      )}

      <EditRecordModal
        key={editSession}
        record={editingRecord}
        open={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
      />
    </RecordsListFrame>
  );
}
