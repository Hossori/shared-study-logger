/**
 * 学習記録の投稿モーダル（学習日・タイトル・学習時間(分)・メモ(任意)）。
 * モバイルでは下からのボトムシート風、PCでは中央配置ダイアログ。
 */
import { useEffect, useState, type FormEvent } from "react";
import { useUiStore } from "../../stores/uiStore";
import { useCreateRecordMutation } from "../../queries/useRecords";
import Button from "../../components/ui/Button";
import { TextAreaField, TextField } from "../../components/ui/FormField";
import ErrorMessage from "../../components/ui/ErrorMessage";

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
          <TextField
            id="studyDate"
            label="学習日"
            type="date"
            required
            value={studyDate}
            onChange={(e) => setStudyDate(e.target.value)}
          />

          <TextField
            id="title"
            label="タイトル・学習内容"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 応用情報技術者試験 過去問"
          />

          <TextField
            id="durationMinutes"
            label="学習時間（分）"
            type="number"
            required
            min={1}
            max={24 * 60}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
          />

          <TextAreaField
            id="memo"
            label="メモ（任意）"
            rows={3}
            maxLength={2000}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="振り返りや気づきなど"
          />

          {createRecordMutation.isError && (
            <ErrorMessage>
              投稿に失敗しました。入力内容を確認してもう一度お試しください。
            </ErrorMessage>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={closePostModal}
              className="flex-1 py-2.5"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={createRecordMutation.isPending}
              className="flex-1 py-2.5"
            >
              {createRecordMutation.isPending ? "投稿中..." : "投稿する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
