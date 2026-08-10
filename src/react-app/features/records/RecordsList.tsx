/**
 * 選択中グループの学習記録一覧（勉強日時・投稿者・タイトル・メモを表示）。
 * 「もっと見る」でカーソルページネーションの次ページを取得する。
 * 自分の記録には編集・削除操作を表示する。
 */
import { useState } from "react";
import { useUiStore } from "../../stores/uiStore";
import { useMeQuery } from "../../queries/useAuth";
import {
  useDeleteRecordMutation,
  useRecordsQuery,
} from "../../queries/useRecords";
import type { StudyRecord } from "../../../../shared/schemas";
import Button from "../../components/ui/Button";
import EditRecordModal from "./EditRecordModal";

const cardClassName =
  "rounded-xl border border-gray-200 bg-white p-4 shadow-sm";

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
  return (
    <li className={cardClassName}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-medium text-gray-500">
          {formatStudyDatetime(record.studyDatetime)}
        </span>
        <span className="text-xs text-gray-400">
          {record.authorDisplayName ?? "不明なユーザー"}
        </span>
      </div>
      <h3 className="mt-1.5 text-base font-semibold text-gray-900 sm:text-lg">
        {record.title}
      </h3>
      {record.memo && (
        <p className="mt-2 text-sm whitespace-pre-wrap text-gray-600">
          {record.memo}
        </p>
      )}
      {isOwner && (
        <div className="mt-3 flex justify-end gap-2 border-t border-gray-100 pt-3">
          <Button
            variant="ghost"
            onClick={() => onEdit(record)}
            className="px-3 py-1.5 text-sm"
          >
            編集
          </Button>
          <Button
            variant="ghost"
            onClick={() => onDelete(record)}
            disabled={isDeleting}
            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            削除
          </Button>
        </div>
      )}
    </li>
  );
}

function EmptyRecordsMessage() {
  return (
    <div className="py-12 text-center text-sm text-gray-400">
      <p className="sm:hidden">
        まだ学習記録がありません。右下の「＋」ボタンから最初の記録を投稿しましょう。
      </p>
      <p className="hidden sm:block">
        まだ学習記録がありません。ヘッダーの「＋
        記録を追加」ボタンから最初の記録を投稿しましょう。
      </p>
    </div>
  );
}

export default function RecordsList() {
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const { data: me } = useMeQuery();
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRecordsQuery(selectedGroupId);
  const deleteRecordMutation = useDeleteRecordMutation(selectedGroupId);
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null);

  const handleDelete = async (record: StudyRecord) => {
    const confirmed = window.confirm(
      `「${record.title}」を削除しますか？この操作は取り消せません。`,
    );
    if (!confirmed) return;
    try {
      await deleteRecordMutation.mutateAsync(record.id);
    } catch {
      // 一覧の invalidate は onSuccess 側。失敗時は現状維持。
    }
  };

  if (!selectedGroupId) {
    return (
      <p className="py-12 text-center text-sm text-gray-400">
        グループを選択してください。
      </p>
    );
  }

  if (isLoading) {
    return (
      <p className="py-12 text-center text-sm text-gray-400">読み込み中...</p>
    );
  }

  if (isError) {
    return (
      <p className="py-12 text-center text-sm text-red-500">
        学習記録の取得に失敗しました。
      </p>
    );
  }

  const records = data?.pages.flatMap((page) => page.records) ?? [];

  if (records.length === 0) {
    return <EmptyRecordsMessage />;
  }

  return (
    <div>
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
    </div>
  );
}
