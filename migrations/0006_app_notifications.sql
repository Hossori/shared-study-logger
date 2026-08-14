-- Migration number: 0006 	 2026-08-15T00:00:00.000Z
-- アプリ内通知（管理者が作成し、有効なものだけ全ユーザーの通知一覧に表示する）

CREATE TABLE app_notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_by TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_app_notifications_enabled_created_at
  ON app_notifications (enabled, created_at DESC);
