-- Migration number: 0005 	 2026-08-15T00:00:00.000Z
-- users にロール（ADMIN / USER）を追加。既存行は USER。
-- 管理者にする例（手動実行）:
--   UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com';

ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER'
  CHECK (role IN ('ADMIN', 'USER'));
