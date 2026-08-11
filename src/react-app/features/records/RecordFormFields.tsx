/**
 * 学習記録の投稿/編集で共有するフォームフィールド群。
 */
import { TextAreaField, TextField } from "../../components/ui/FormField";

export interface RecordFormValues {
  studyDatetime: string;
  title: string;
  memo: string;
}

interface RecordFormFieldsProps {
  idPrefix: string;
  values: RecordFormValues;
  onChange: (next: RecordFormValues) => void;
}

export default function RecordFormFields({
  idPrefix,
  values,
  onChange,
}: RecordFormFieldsProps) {
  return (
    <>
      <TextField
        id={`${idPrefix}-studyDatetime`}
        label="勉強日時"
        type="datetime-local"
        required
        value={values.studyDatetime}
        onChange={(e) => onChange({ ...values, studyDatetime: e.target.value })}
      />

      <TextField
        id={`${idPrefix}-title`}
        label="タイトル・学習内容"
        type="text"
        required
        maxLength={200}
        value={values.title}
        onChange={(e) => onChange({ ...values, title: e.target.value })}
      />

      <TextAreaField
        id={`${idPrefix}-memo`}
        label="メモ"
        rows={3}
        maxLength={2000}
        value={values.memo}
        onChange={(e) => onChange({ ...values, memo: e.target.value })}
        placeholder="振り返りや気づきなど"
      />
    </>
  );
}
