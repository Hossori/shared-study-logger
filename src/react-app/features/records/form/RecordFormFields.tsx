/**
 * 学習記録の投稿/編集で共有するフォームフィールド群。
 */
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RECORD_MEMO_MAX, RECORD_TITLE_MAX } from "@shared/schemas";
import StudyDatetimeField from "./StudyDatetimeField";
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
        <FieldLabel htmlFor={`${idPrefix}-title`} required>
          タイトル・学習内容
        </FieldLabel>
        <Input
          id={`${idPrefix}-title`}
          type="text"
          required
          maxLength={RECORD_TITLE_MAX}
          value={values.title}
          onChange={(e) => onChange({ ...values, title: e.target.value })}
        />
      </Field>

      <StudyDatetimeField
        idPrefix={idPrefix}
        studyDatetime={values.studyDatetime}
        durationMinutes={values.durationMinutes}
        onChange={(studyDatetime, durationMinutes) =>
          onChange({
            ...values,
            studyDatetime,
            durationMinutes,
            preservedStudyDatetime: null,
          })
        }
      />

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-memo`}>メモ</FieldLabel>
        <Textarea
          id={`${idPrefix}-memo`}
          rows={3}
          maxLength={RECORD_MEMO_MAX}
          value={values.memo}
          onChange={(e) => onChange({ ...values, memo: e.target.value })}
          placeholder="振り返りや気づきなど"
          className="resize-none"
        />
      </Field>
    </FieldGroup>
  );
}
