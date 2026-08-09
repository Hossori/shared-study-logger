-- Migration number: 0001 	 2026-08-03T00:00:00.000Z
-- 学習記録共有アプリ 初期スキーマ
-- スキーマ全体のER図とテーブルの関係はREADME.mdの「データモデル」節を参照。

PRAGMA foreign_keys = ON;

-- ユーザー（固定アカウント方式。管理者が事前に登録する）
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- グループ（学習記録を共有する単位）
CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- グループ所属（多対多の中間テーブル）
CREATE TABLE group_members (
  group_id TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (group_id, user_id)
);

-- ユーザーがどのグループに所属しているかを引く際に使うインデックス
CREATE INDEX idx_group_members_user_id ON group_members (user_id);

-- 学習記録
CREATE TABLE study_records (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  study_date TEXT NOT NULL,
  title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  memo TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- グループ内の記録一覧を新しい順に取得するためのカーソルページネーション用インデックス
CREATE INDEX idx_study_records_group_created_at ON study_records (group_id, created_at DESC);
CREATE INDEX idx_study_records_user_id ON study_records (user_id);

-- Push通知の購読情報（1ユーザーにつき複数端末分の複数行を許容）
CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions (user_id);
