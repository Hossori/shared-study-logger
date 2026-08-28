/**
 * 学習記録の編集モーダル（学習日時・学習時間(任意)・タイトル・メモ(任意)）。
 * フォームUIは RecordFormFields / RecordModalShell を共有する。
 */
import { useState, type FormEvent } from "react";
import type { StudyRecord } from "../../../../shared/schemas";
import { useUiStore } from "../../stores/uiStore";
import { useUpdateRecordMutation } from "../../queries/useRecords";
import RecordFormFields from "./RecordFormFields";
import RecordModalShell from "./RecordModalShell";
import {
  buildRecordRequestPayload,
  toDatetimeLocalString,
  type RecordFormValues,
} from "./recordFormUtils";

interface EditRecordModalProps {
  record: StudyRecord | null;
  open: boolean;
  onClose: () => void;
}

export default function EditRecordModal({
  record,
  open,
  onClose,
}: EditRecordModalProps) {
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const updateRecordMutation = useUpdateRecordMutation(selectedGroupId);

  const [values, setValues] = useState<RecordFormValues>(() =>
    record
      ? {
          studyDatetime: toDatetimeLocalString(record.studyDatetime),
          title: record.title,
          memo: record.memo ?? "",
          durationMinutes: record.durationMinutes ?? null,
        }
      : { studyDatetime: "", title: "", memo: "", durationMinutes: null },
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!record) return;
    const payload = buildRecordRequestPayload(values);
    if (!payload) return;

    try {
      await updateRecordMutation.mutateAsync({
        recordId: record.id,
        input: payload,
      });
      onClose();
    } catch {
      // エラーメッセージはmutation.isErrorから表示するため、ここでは握りつぶす
    }
  };

  return (
    <RecordModalShell
      open={open}
      title="学習記録を編集"
      onClose={onClose}
      onSubmit={handleSubmit}
      errorMessage={
        updateRecordMutation.isError
          ? "更新に失敗しました。入力内容を確認してもう一度お試しください。"
          : null
      }
      isPending={updateRecordMutation.isPending}
      submitLabel="保存する"
      pendingLabel="保存中..."
    >
      <RecordFormFields idPrefix="edit" values={values} onChange={setValues} />
    </RecordModalShell>
  );
}
