/**
 * 学習記録の投稿モーダル（学習日・タイトル・学習時間(分)・メモ(任意)）。
 * モバイルでは下からのボトムシート風、PCでは中央配置ダイアログ。
 */
import { useEffect, useState, type FormEvent } from "react";
import { useUiStore } from "../../stores/uiStore";
import { useCreateRecordMutation } from "../../queries/useRecords";

function todayDateString(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function PostRecordModal() {
  const isOpen = useUiStore((state) => state.isPostModalOpen);
  const closePostModal = useUiStore((state) => state.closePostModal);
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const createRecordMutation = useCreateRecordMutation(selectedGroupId);

  const [studyDate, setStudyDate] = useState(todayDateString());
  const [title, setTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (isOpen) {
      setStudyDate(todayDateString());
      setTitle("");
      setDurationMinutes("30");
      setMemo("");
      createRecordMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedDuration = Number.parseInt(durationMinutes, 10);
    if (!studyDate || !title.trim() || !Number.isFinite(parsedDuration)) return;

    try {
      await createRecordMutation.mutateAsync({
        studyDate,
        title: title.trim(),
        durationMinutes: parsedDuration,
        memo: memo.trim() ? memo.trim() : undefined,
      });
      closePostModal();
    } catch {
      // エラーメッセージはmutation.isErrorから表示するため、ここでは握りつぶす
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={closePostModal}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">学習記録を投稿</h2>
          <button
            type="button"
            onClick={closePostModal}
            aria-label="閉じる"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="studyDate"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              学習日
            </label>
            <input
              id="studyDate"
              type="date"
              required
              value={studyDate}
              onChange={(e) => setStudyDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              タイトル・学習内容
            </label>
            <input
              id="title"
              type="text"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 応用情報技術者試験 過去問"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="durationMinutes"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              学習時間（分）
            </label>
            <input
              id="durationMinutes"
              type="number"
              required
              min={1}
              max={24 * 60}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label
              htmlFor="memo"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              メモ（任意）
            </label>
            <textarea
              id="memo"
              rows={3}
              maxLength={2000}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="振り返りや気づきなど"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {createRecordMutation.isError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              投稿に失敗しました。入力内容を確認してもう一度お試しください。
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={closePostModal}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={createRecordMutation.isPending}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createRecordMutation.isPending ? "投稿中..." : "投稿する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
