-- Migration number: 0011 	 2026-09-06T00:00:00.000Z
-- duration_minutes の上限を 23時間55分（1435）に更新する。
-- SQLite は CHECK 制約を直接変更できないため study_records を再作成する。
-- 先行する 0007 の record_reactions は、FK を OFF にしてから DROP するため行は残る。

PRAGMA foreign_keys=OFF;

CREATE TABLE study_records_new (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  study_datetime TEXT,
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
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO study_records_new
SELECT
  id,
  group_id,
  user_id,
  study_datetime,
  title,
  duration_minutes,
  memo,
  created_at,
  updated_at
FROM study_records;

DROP TABLE study_records;

ALTER TABLE study_records_new RENAME TO study_records;

CREATE INDEX idx_study_records_group_sort
  ON study_records (group_id, COALESCE(study_datetime, created_at) DESC, id DESC);

CREATE INDEX idx_study_records_user_id ON study_records (user_id);

PRAGMA foreign_keys=ON;
