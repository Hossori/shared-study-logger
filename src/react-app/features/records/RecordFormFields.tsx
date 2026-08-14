/**
 * 学習記録の投稿/編集で共有するフォームフィールド群。
 */
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RecordFormValues } from "./recordFormUtils";

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
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-studyDatetime`}>勉強日時</FieldLabel>
        <Input
          id={`${idPrefix}-studyDatetime`}
          type="datetime-local"
          required
          value={values.studyDatetime}
          onChange={(e) =>
            onChange({ ...values, studyDatetime: e.target.value })
          }
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-title`}>
          タイトル・学習内容
        </FieldLabel>
        <Input
          id={`${idPrefix}-title`}
          type="text"
          required
          maxLength={200}
          value={values.title}
          onChange={(e) => onChange({ ...values, title: e.target.value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-memo`}>メモ</FieldLabel>
        <Textarea
          id={`${idPrefix}-memo`}
          rows={3}
          maxLength={2000}
          value={values.memo}
          onChange={(e) => onChange({ ...values, memo: e.target.value })}
          placeholder="振り返りや気づきなど"
          className="resize-none"
        />
      </Field>
    </FieldGroup>
  );
}
