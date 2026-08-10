/**
 * 学習記録の編集モーダル（勉強日時・タイトル・メモ(任意)）。
 * フォームUIは RecordFormFields / RecordModalShell を共有する。
 */
import { useEffect, useState, type FormEvent } from "react";
import type { StudyRecord } from "../../../../shared/schemas";
import { useUiStore } from "../../stores/uiStore";
import { useUpdateRecordMutation } from "../../queries/useRecords";
import RecordFormFields, {
  type RecordFormValues,
} from "./RecordFormFields";
import RecordModalShell from "./RecordModalShell";
import {
  buildRecordRequestPayload,
  toDatetimeLocalString,
} from "./recordFormUtils";

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

  const [values, setValues] = useState<RecordFormValues>(() => ({
    studyDatetime: toDatetimeLocalString(record.studyDatetime),
    title: record.title,
    memo: record.memo ?? "",
  }));

  useEffect(() => {
    setValues({
      studyDatetime: toDatetimeLocalString(record.studyDatetime),
      title: record.title,
      memo: record.memo ?? "",
    });
    updateRecordMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      <RecordFormFields
        idPrefix="edit"
        values={values}
        onChange={setValues}
      />
    </RecordModalShell>
  );
}
