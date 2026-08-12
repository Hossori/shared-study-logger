/**
 * 選択中グループの学習記録一覧（勉強日時・投稿者・タイトル・メモを表示）。
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
import Button from "../../components/ui/Button";
import UserAvatar from "../../components/UserAvatar";
import { useConfirm } from "../../components/useConfirm";
import GroupSwitcher from "../groups/GroupSwitcher";
import EditRecordModal from "./EditRecordModal";

const cardClassName =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";
const toolbarClassName = "mb-4 flex flex-wrap items-center gap-2 sm:gap-3";
const toolbarGroupClassName = "min-w-0 flex-1";
const addRecordButtonClassName =
  "hidden shrink-0 items-center gap-1.5 px-4 py-1.5 text-sm sm:inline-flex";
const authorAvatarLinkClassName =
  "inline-flex shrink-0 rounded-full transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";
const iconActionButtonClassName =
  "inline-flex h-9 w-9 items-center justify-center p-0";

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
    <li className={cardClassName}>
      <div className="flex items-start justify-between gap-x-3">
        <div className="flex min-w-0 items-center gap-1.5">
          <Link
            to={`/users/${record.userId}`}
            className={authorAvatarLinkClassName}
            aria-label={`${authorName}のユーザーページ`}
          >
            <UserAvatar
              avatarKey={record.authorAvatarKey ?? null}
              className="h-6 w-6"
            />
          </Link>
          <span className="truncate text-xs text-gray-500">{authorName}</span>
        </div>
        {isOwner && (
          <div className="-mt-1 -mr-1 flex shrink-0 gap-1">
            <Button
              variant="ghost"
              onClick={() => onEdit(record)}
              aria-label="編集"
              title="編集"
              className={iconActionButtonClassName}
            >
              <Pencil className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              onClick={() => onDelete(record)}
              disabled={isDeleting}
              aria-label="削除"
              title="削除"
              className={`${iconActionButtonClassName} text-red-600 hover:bg-red-50 hover:text-red-700`}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        )}
      </div>
      <span className="mt-1.5 block text-xs font-medium text-gray-500">
        {formatStudyDatetime(record.studyDatetime)}
      </span>
      <h3 className="mt-1.5 text-base font-semibold text-gray-900 sm:text-lg">
        {record.title}
      </h3>
      {record.memo && (
        <p className="mt-2 text-sm whitespace-pre-wrap text-gray-600">
          {record.memo}
        </p>
      )}
    </li>
  );
}

function EmptyRecordsMessage() {
  return (
    <div className="py-12 text-center text-sm text-gray-400">
      <p className="sm:hidden">
        まだ学習記録がありません。右下の追加ボタンから最初の記録を投稿しましょう。
      </p>
      <p className="hidden sm:block">
        まだ学習記録がありません。「記録を追加」ボタンから最初の記録を投稿しましょう。
      </p>
    </div>
  );
}

function RecordsToolbar() {
  const openPostModal = useUiStore((state) => state.openPostModal);

  return (
    <div className={toolbarClassName}>
      <div className={toolbarGroupClassName}>
        <GroupSwitcher />
      </div>
      <Button onClick={openPostModal} className={addRecordButtonClassName}>
        <Plus className="h-4 w-4" aria-hidden />
        記録を追加
      </Button>
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
        <p className="py-12 text-center text-sm text-gray-400">
          グループを選択してください。
        </p>
      </RecordsListFrame>
    );
  }

  if (isInitialLoading) {
    return (
      <RecordsListFrame>
        <p className="py-12 text-center text-sm text-gray-400">
          学習記録を読み込み中...
        </p>
      </RecordsListFrame>
    );
  }

  if (isError) {
    return (
      <RecordsListFrame>
        <p className="py-12 text-center text-sm text-red-500">
          学習記録の取得に失敗しました。
        </p>
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
      <ul className="space-y-3">
        {records.map((record) => (
          <RecordCard
            key={record.id}
            record={record}
            isOwner={me?.id === record.userId}
            onEdit={setEditingRecord}
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
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="px-5 py-2 text-sm"
          >
            {isFetchingNextPage ? "読み込み中..." : "もっと見る"}
          </Button>
        </div>
      )}

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
        />
      )}
    </RecordsListFrame>
  );
}
