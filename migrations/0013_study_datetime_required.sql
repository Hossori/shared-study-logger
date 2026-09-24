-- Migration number: 0013 	 2026-09-23T00:00:00.000Z
-- started_at を study_datetime に戻し NOT NULL 化。ペア CHECK を削除する。
-- SQLite は CHECK / NOT NULL 変更にテーブル再作成が要るため Detach → rebuild → Reattach。

-- Detach record_reactions（親 FK なし・ON DELETE CASCADE なし）
CREATE TABLE record_reactions_detach (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  stamp TEXT NOT NULL CHECK (
    stamp IN ('thumbs_up', 'smile', 'laugh', 'astonished', 'cry', 'muscle')
  ),
  created_at TEXT NOT NULL,
  UNIQUE (record_id, user_id, stamp)
);

INSERT INTO record_reactions_detach
SELECT id, record_id, user_id, stamp, created_at
FROM record_reactions;

DROP TABLE record_reactions;

ALTER TABLE record_reactions_detach RENAME TO record_reactions;

CREATE INDEX idx_record_reactions_record_id ON record_reactions (record_id);

-- Rebuild study_records
CREATE TABLE study_records_new (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  study_datetime TEXT NOT NULL,
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
  COALESCE(started_at, created_at),
  title,
  duration_minutes,
  memo,
  created_at,
  updated_at
FROM study_records;

DROP TABLE study_records;

ALTER TABLE study_records_new RENAME TO study_records;

CREATE INDEX idx_study_records_group_sort
  ON study_records (group_id, study_datetime DESC, id DESC);

CREATE INDEX idx_study_records_user_id ON study_records (user_id);

-- Reattach record_reactions（ON DELETE CASCADE 復帰）
CREATE TABLE record_reactions_reattach (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES study_records (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  stamp TEXT NOT NULL CHECK (
    stamp IN ('thumbs_up', 'smile', 'laugh', 'astonished', 'cry', 'muscle')
  ),
  created_at TEXT NOT NULL,
  UNIQUE (record_id, user_id, stamp)
);

INSERT INTO record_reactions_reattach
SELECT id, record_id, user_id, stamp, created_at
FROM record_reactions;

DROP TABLE record_reactions;

ALTER TABLE record_reactions_reattach RENAME TO record_reactions;

CREATE INDEX idx_record_reactions_record_id ON record_reactions (record_id);
