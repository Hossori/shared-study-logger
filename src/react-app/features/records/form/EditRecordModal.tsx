/**
 * 学習記録の編集モーダル（学習日時・学習時間(任意)・タイトル・メモ(任意)）。
 * フォームUIは RecordFormFields / RecordModalShell を共有する。
 */
import { useState, type FormEvent } from "react";
import {
  UpdateStudyRecordRequestSchema,
  type StudyRecord,
} from "@shared/schemas";
import { useUpdateRecordMutation } from "../api/useRecords";
import RecordFormFields from "./RecordFormFields";
import RecordModalShell from "./RecordModalShell";
import {
  buildRecordRequestPayload,
  toDatetimeLocalString,
  type RecordFormValues,
} from "./recordFormUtils";

interface EditRecordModalProps {
  groupId: string | null;
  record: StudyRecord | null;
  open: boolean;
  onClose: () => void;
}

export default function EditRecordModal({
  groupId,
  record,
  open,
  onClose,
}: EditRecordModalProps) {
  const updateRecordMutation = useUpdateRecordMutation(groupId);
  const [clientError, setClientError] = useState<string | null>(null);

  const [values, setValues] = useState<RecordFormValues>(() =>
    record
      ? {
          studyDatetime: toDatetimeLocalString(record.studyDatetime),
          preservedStudyDatetime: record.studyDatetime,
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
    const parsed = UpdateStudyRecordRequestSchema.safeParse(payload);
    if (!parsed.success) {
      setClientError(
        "更新に失敗しました。入力内容を確認してもう一度お試しください。",
      );
      return;
    }
    setClientError(null);

    try {
      await updateRecordMutation.mutateAsync({
        recordId: record.id,
        input: parsed.data,
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
        clientError ??
        (updateRecordMutation.isError
          ? "更新に失敗しました。入力内容を確認してもう一度お試しください。"
          : null)
      }
      isPending={updateRecordMutation.isPending}
      submitLabel="保存する"
      pendingLabel="保存中..."
    >
      <RecordFormFields idPrefix="edit" values={values} onChange={setValues} />
    </RecordModalShell>
  );
}
