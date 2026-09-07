-- Migration number: 0012 	 2026-09-07T00:00:00.000Z
-- study_datetime を started_at に改名し、started_at と duration_minutes のペア制約を追加する。
-- 開始のみの既存行は started_at / duration_minutes を NULL にする。
-- SQLite は CHECK 制約を直接変更できないため study_records を再作成する。
-- 先行する 0007 の record_reactions は、FK を OFF にしてから DROP するため行は残る。

PRAGMA foreign_keys=OFF;

CREATE TABLE study_records_new (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  started_at TEXT,
  title TEXT NOT NULL,
  duration_minutes INTEGER
    CHECK (
      duration_minutes IS NULL
      OR (
        duration_minutes >= 5
        AND duration_minutes <= 1435
        AND duration_minutes % 5 = 0
      )
    ),
  memo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (
    (started_at IS NULL AND duration_minutes IS NULL)
    OR (started_at IS NOT NULL AND duration_minutes IS NOT NULL)
  )
);

INSERT INTO study_records_new
SELECT
  id,
  group_id,
  user_id,
  CASE
    WHEN study_datetime IS NOT NULL AND duration_minutes IS NOT NULL
    THEN study_datetime
    ELSE NULL
  END,
  title,
  CASE
    WHEN study_datetime IS NOT NULL AND duration_minutes IS NOT NULL
    THEN duration_minutes
    ELSE NULL
  END,
  memo,
  created_at,
  updated_at
FROM study_records;

DROP TABLE study_records;

ALTER TABLE study_records_new RENAME TO study_records;

CREATE INDEX idx_study_records_group_sort
  ON study_records (group_id, COALESCE(started_at, created_at) DESC, id DESC);

CREATE INDEX idx_study_records_user_id ON study_records (user_id);

PRAGMA foreign_keys=ON;
