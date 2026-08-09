-- Migration number: 0003 	 2026-08-09T00:00:00.000Z
-- 0002 以前の study_date (YYYY-MM-DD) 形式を ISO 日時文字列に正規化する。

UPDATE study_records
SET study_datetime = study_datetime || 'T00:00:00.000Z'
WHERE length(study_datetime) = 10;
