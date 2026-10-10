/**
 * 学習記録の投稿モーダル（学習日時・学習時間(任意)・タイトル・メモ(任意)）。
 * フォームUIは RecordFormFields / RecordModalShell を共有する。
 */
import { useCallback, useLayoutEffect, useState, type FormEvent } from "react";
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

type PostRecordFormBinding = {
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  errorMessage: string | null;
  isPending: boolean;
};

function PostRecordFormBody({
  groupId,
  onClose,
  onBindingChange,
}: {
  groupId: string | null;
  onClose: () => void;
  onBindingChange: (binding: PostRecordFormBinding | null) => void;
}) {
  const { mutateAsync, isPending, isError } = useCreateRecordMutation(groupId);
  const [clientError, setClientError] = useState<string | null>(null);

  const [values, setValues] = useState<RecordFormValues>({
    studyDatetime: "",
    title: "",
    memo: "",
    durationMinutes: null,
  });

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
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
        await mutateAsync(parsed.data);
        onClose();
      } catch {
        // エラーメッセージはmutation.isErrorから表示するため、ここでは握りつぶす
      }
    },
    [mutateAsync, onClose, values],
  );

  const errorMessage =
    clientError ??
    (isError
      ? "投稿に失敗しました。入力内容を確認してもう一度お試しください。"
      : null);

  useLayoutEffect(() => {
    onBindingChange({
      handleSubmit,
      errorMessage,
      isPending,
    });
    return () => onBindingChange(null);
  }, [errorMessage, handleSubmit, isPending, isError, onBindingChange]);

  return (
    <RecordFormFields idPrefix="post" values={values} onChange={setValues} />
  );
}

export default function PostRecordModal({
  groupId,
  open,
  onClose,
}: PostRecordModalProps) {
  const [session, setSession] = useState(0);
  const [prevOpen, setPrevOpen] = useState(open);
  const [formBinding, setFormBinding] = useState<PostRecordFormBinding | null>(
    null,
  );
  const onBindingChange = useCallback(
    (binding: PostRecordFormBinding | null) => setFormBinding(binding),
    [],
  );

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSession((current) => current + 1);
    }
  }

  return (
    <RecordModalShell
      open={open}
      title="学習記録を投稿"
      onClose={onClose}
      onSubmit={(event) => {
        formBinding?.handleSubmit(event);
      }}
      errorMessage={formBinding?.errorMessage ?? null}
      isPending={formBinding?.isPending ?? false}
      submitLabel="投稿する"
      pendingLabel="投稿中..."
    >
      <PostRecordFormBody
        key={session}
        groupId={groupId}
        onClose={onClose}
        onBindingChange={onBindingChange}
      />
    </RecordModalShell>
  );
}
