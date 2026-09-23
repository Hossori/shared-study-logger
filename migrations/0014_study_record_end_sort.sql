-- Migration number: 0014 	 2026-09-23T00:00:00.000Z
-- 一覧ソート用インデックスを終了時刻（study_datetime + duration）基準に差し替える。

DROP INDEX IF EXISTS idx_study_records_group_sort;

CREATE INDEX idx_study_records_group_sort
  ON study_records (
    group_id,
    datetime(study_datetime, '+' || COALESCE(duration_minutes, 0) || ' minutes') DESC,
    id DESC
  );
