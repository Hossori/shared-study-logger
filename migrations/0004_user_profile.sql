-- Migration number: 0004 	 2026-08-10T00:00:00.000Z
-- マイページ用: users に自己紹介(bio)とアバタープリセットキー(avatar_key)を追加

ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN avatar_key TEXT;
