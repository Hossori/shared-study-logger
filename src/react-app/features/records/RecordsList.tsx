/**
 * 選択中グループの学習記録一覧（日付・投稿者・タイトル・学習時間・メモを表示）。
 * 「もっと見る」でカーソルページネーションの次ページを取得する。
 */
import { useUiStore } from "../../stores/uiStore";
import { useRecordsQuery } from "../../queries/useRecords";
import type { StudyRecord } from "../../../../shared/schemas";

function formatStudyDate(studyDate: string): string {
  const date = new Date(studyDate);
  if (Number.isNaN(date.getTime())) return studyDate;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest}分`;
  if (rest === 0) return `${hours}時間`;
  return `${hours}時間${rest}分`;
}

function RecordCard({ record }: { record: StudyRecord }) {
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-medium text-gray-500">
          {formatStudyDate(record.studyDate)}
        </span>
        <span className="text-xs text-gray-400">
          {record.authorDisplayName ?? "不明なユーザー"}
        </span>
      </div>
      <h3 className="mt-1.5 text-base font-semibold text-gray-900 sm:text-lg">
        {record.title}
      </h3>
      <p className="mt-1 text-sm font-medium text-indigo-600">
        ⏱ {formatDuration(record.durationMinutes)}
      </p>
      {record.memo && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
          {record.memo}
        </p>
      )}
    </li>
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
    return (
      <p className="py-12 text-center text-sm text-gray-400">
        まだ学習記録がありません。右下の「＋」ボタンから最初の記録を投稿しましょう。
      </p>
    );
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
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isFetchingNextPage ? "読み込み中..." : "もっと見る"}
          </button>
        </div>
      )}
    </div>
  );
}
