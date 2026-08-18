/**
 * 学習記録の投稿モーダル（学習日時・タイトル・メモ(任意)）。
 * フォームUIは RecordFormFields / RecordModalShell を共有する。
 */
import { useEffect, useState, type FormEvent } from "react";
import { useUiStore } from "../../stores/uiStore";
import { useCreateRecordMutation } from "../../queries/useRecords";
import RecordFormFields from "./RecordFormFields";
import RecordModalShell from "./RecordModalShell";
import {
  buildRecordRequestPayload,
  nowDatetimeLocalString,
  type RecordFormValues,
} from "./recordFormUtils";

export default function PostRecordModal() {
  const isOpen = useUiStore((state) => state.isPostModalOpen);
  const closePostModal = useUiStore((state) => state.closePostModal);
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const createRecordMutation = useCreateRecordMutation(selectedGroupId);

  const [values, setValues] = useState<RecordFormValues>({
    studyDatetime: nowDatetimeLocalString(),
    title: "",
    memo: "",
  });

  useEffect(() => {
    if (isOpen) {
      setValues({
        studyDatetime: nowDatetimeLocalString(),
        title: "",
        memo: "",
      });
      createRecordMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildRecordRequestPayload(values);
    if (!payload) return;

    try {
      await createRecordMutation.mutateAsync(payload);
      closePostModal();
    } catch {
      // エラーメッセージはmutation.isErrorから表示するため、ここでは握りつぶす
    }
  };

  return (
    <RecordModalShell
      open={isOpen}
      title="学習記録を投稿"
      onClose={closePostModal}
      onSubmit={handleSubmit}
      errorMessage={
        createRecordMutation.isError
          ? "投稿に失敗しました。入力内容を確認してもう一度お試しください。"
          : null
      }
      isPending={createRecordMutation.isPending}
      submitLabel="投稿する"
      pendingLabel="投稿中..."
    >
      <RecordFormFields idPrefix="post" values={values} onChange={setValues} />
    </RecordModalShell>
  );
}
