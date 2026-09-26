/**
 * 学習記録の投稿モーダル（学習日時・学習時間(任意)・タイトル・メモ(任意)）。
 * フォームUIは RecordFormFields / RecordModalShell を共有する。
 */
import { useEffect, useState, type FormEvent } from "react";
import { useCreateRecordMutation } from "../api/useRecords";
import RecordFormFields from "./RecordFormFields";
import RecordModalShell from "./RecordModalShell";
import {
  buildRecordFormSource,
  CreateRecordFormSchema,
  type RecordFormValues,
} from "./recordFormUtils";

interface PostRecordModalProps {
  groupId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function PostRecordModal({
  groupId,
  open,
  onClose,
}: PostRecordModalProps) {
  const createRecordMutation = useCreateRecordMutation(groupId);
  const [clientError, setClientError] = useState<string | null>(null);

  const [values, setValues] = useState<RecordFormValues>({
    studyDatetime: "",
    title: "",
    memo: "",
    durationMinutes: null,
  });

  useEffect(() => {
    if (open) {
      setValues({
        studyDatetime: "",
        title: "",
        memo: "",
        durationMinutes: null,
      });
      createRecordMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = CreateRecordFormSchema.safeParse(
      buildRecordFormSource(values),
    );
    if (!parsed.success) {
      setClientError(
        "投稿に失敗しました。入力内容を確認してもう一度お試しください。",
      );
      return;
    }
    setClientError(null);

    try {
      await createRecordMutation.mutateAsync(parsed.data);
      onClose();
    } catch {
      // エラーメッセージはmutation.isErrorから表示するため、ここでは握りつぶす
    }
  };

  return (
    <RecordModalShell
      open={open}
      title="学習記録を投稿"
      onClose={onClose}
      onSubmit={handleSubmit}
      errorMessage={
        clientError ??
        (createRecordMutation.isError
          ? "投稿に失敗しました。入力内容を確認してもう一度お試しください。"
          : null)
      }
      isPending={createRecordMutation.isPending}
      submitLabel="投稿する"
      pendingLabel="投稿中..."
    >
      <RecordFormFields idPrefix="post" values={values} onChange={setValues} />
    </RecordModalShell>
  );
}
