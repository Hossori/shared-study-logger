-- Migration number: 0007 	 2026-09-02T00:00:00.000Z
-- 学習記録へのリアクションスタンプ（同一ユーザー×同一スタンプは1回）

CREATE TABLE record_reactions (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL REFERENCES study_records (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  stamp TEXT NOT NULL CHECK (
    stamp IN ('thumbs_up', 'smile', 'laugh', 'astonished', 'cry', 'muscle')
  ),
  created_at TEXT NOT NULL,
  UNIQUE (record_id, user_id, stamp)
);

CREATE INDEX idx_record_reactions_record_id ON record_reactions (record_id);
