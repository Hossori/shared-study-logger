-- Migration number: 0008 	 2026-08-28T00:00:00.000Z
-- 学習記録に任意の学習時間（分）を再追加する。未設定は NULL。
-- 10分刻み・上限12時間はアプリ側でも検証する。

ALTER TABLE study_records ADD COLUMN duration_minutes INTEGER
  CHECK (
    duration_minutes IS NULL
    OR (
      duration_minutes >= 10
      AND duration_minutes <= 720
      AND duration_minutes % 10 = 0
    )
  );
