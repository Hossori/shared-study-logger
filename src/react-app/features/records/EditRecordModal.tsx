/**
 * 学習記録の編集モーダル（勉強日時・タイトル・メモ(任意)）。
 * 投稿モーダル(`PostRecordModal`)と同じレイアウト・フォームUXを踏襲する。
 */
import { useEffect, useState, type FormEvent } from "react";
import type { StudyRecord } from "../../../../shared/schemas";
import { useUiStore } from "../../stores/uiStore";
import { useUpdateRecordMutation } from "../../queries/useRecords";
import Button from "../../components/ui/Button";
import { TextAreaField, TextField } from "../../components/ui/FormField";
import ErrorMessage from "../../components/ui/ErrorMessage";

const overlayClassName =
  "fixed inset-0 z-30 flex items-end justify-center bg-black/40 sm:items-center";
const panelClassName =
  "max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6";
const closeButtonClassName =
  "rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600";

function toDatetimeLocalString(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

interface EditRecordModalProps {
  record: StudyRecord;
  onClose: () => void;
}

export default function EditRecordModal({
  record,
  onClose,
}: EditRecordModalProps) {
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const updateRecordMutation = useUpdateRecordMutation(selectedGroupId);

  const [studyDatetime, setStudyDatetime] = useState(() =>
    toDatetimeLocalString(record.studyDatetime),
  );
  const [title, setTitle] = useState(record.title);
  const [memo, setMemo] = useState(record.memo ?? "");

  useEffect(() => {
    setStudyDatetime(toDatetimeLocalString(record.studyDatetime));
    setTitle(record.title);
    setMemo(record.memo ?? "");
    updateRecordMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!studyDatetime || !title.trim()) return;

    const parsedDatetime = new Date(studyDatetime);
    if (Number.isNaN(parsedDatetime.getTime())) return;

    try {
      await updateRecordMutation.mutateAsync({
        recordId: record.id,
        input: {
          studyDatetime: parsedDatetime.toISOString(),
          title: title.trim(),
          memo: memo.trim() ? memo.trim() : undefined,
        },
      });
      onClose();
    } catch {
      // エラーメッセージはmutation.isErrorから表示するため、ここでは握りつぶす
    }
  };

  return (
    <div className={overlayClassName} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={panelClassName}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">学習記録を編集</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={closeButtonClassName}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            id="edit-studyDatetime"
            label="勉強日時"
            type="datetime-local"
            required
            value={studyDatetime}
            onChange={(e) => setStudyDatetime(e.target.value)}
          />

          <TextField
            id="edit-title"
            label="タイトル・学習内容"
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 応用情報技術者試験 過去問"
          />

          <TextAreaField
            id="edit-memo"
            label="メモ（任意）"
            rows={3}
            maxLength={2000}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="振り返りや気づきなど"
          />

          {updateRecordMutation.isError && (
            <ErrorMessage>
              更新に失敗しました。入力内容を確認してもう一度お試しください。
            </ErrorMessage>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 py-2.5"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={updateRecordMutation.isPending}
              className="flex-1 py-2.5"
            >
              {updateRecordMutation.isPending ? "保存中..." : "保存する"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
