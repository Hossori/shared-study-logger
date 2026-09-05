#!/bin/sh
set -eu

if [ "$(id -u)" = "0" ]; then
	mkdir -p /app/node_modules /app/.wrangler
	# 毎回 node_modules 全体を chown -R すると初回以降も数十秒かかるため、
	# ディレクトリ自体の所有者だけ直す（中身はイメージ／volume 作成時の node 所有を維持）。
	chown node:node /app/node_modules /app/.wrangler
	exec gosu node "$0" "$@"
fi

cd /app

if [ -d .dev.vars ]; then
	echo "error: .dev.vars がディレクトリになっています。" >&2
	echo "ファイルが無い状態で個別マウントすると Docker がディレクトリを作ります。" >&2
	echo "ホスト側のディレクトリを削除し、.dev.vars をファイルとして作成してください。" >&2
	exit 1
fi

if [ ! -f .dev.vars ]; then
	echo "error: .dev.vars が見つかりません。" >&2
	echo "プロジェクトルートに .dev.vars を作成してから docker compose up してください。" >&2
	echo "手順: .dev.vars.example をコピーし、pnpm exec pushforge vapid で鍵を埋める。" >&2
	echo "Push を試さない場合は、README の CI 用ダミー値でも起動できます。" >&2
	exit 1
fi

pnpm install --frozen-lockfile

# 非対話。--yes は wrangler 4.88 の d1 migrations apply に無い。
CI=true pnpm exec wrangler d1 migrations apply shared-study-logger-db --local
pnpm seed

exec "$@"
