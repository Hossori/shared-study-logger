-- Migration number: 0002 	 2026-08-09T00:00:00.000Z
-- study_date を study_datetime に改名し、duration_minutes を削除。
-- 一覧取得のソート用インデックスを study_datetime / updated_at / id 基準に更新。

ALTER TABLE study_records RENAME COLUMN study_date TO study_datetime;

ALTER TABLE study_records DROP COLUMN duration_minutes;

DROP INDEX IF EXISTS idx_study_records_group_created_at;

CREATE INDEX idx_study_records_group_sort
  ON study_records (group_id, study_datetime DESC, updated_at DESC, id DESC);
