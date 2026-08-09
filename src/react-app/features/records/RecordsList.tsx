/**
 * 選択中グループの学習記録一覧（勉強日時・投稿者・タイトル・メモを表示）。
 * 「もっと見る」でカーソルページネーションの次ページを取得する。
 */
import { useUiStore } from "../../stores/uiStore";
import { useRecordsQuery } from "../../queries/useRecords";
import type { StudyRecord } from "../../../../shared/schemas";
import Button from "../../components/ui/Button";

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

function RecordCard({ record }: { record: StudyRecord }) {
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
        まだ学習記録がありません。ヘッダーの「＋ 記録を追加」ボタンから最初の記録を投稿しましょう。
      </p>
    </div>
  );
}

export default function RecordsList() {
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useRecordsQuery(selectedGroupId);

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
          <RecordCard key={record.id} record={record} />
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
    </div>
  );
}
