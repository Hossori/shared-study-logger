# E2E（Playwright スモーク）

上限 7 本。Push / PWA は対象外。詳細方針は
[`.cursor/skills/testing-strategy/SKILL.md`](../.cursor/skills/testing-strategy/SKILL.md)。

## 前提

```bash
pnpm exec wrangler d1 migrations apply shared-study-logger-db --local
pnpm seed
# .dev.vars に VAPID_* があること（README 参照）
pnpm playwright:install
pnpm test:e2e
```

`pnpm playwright:install`（`playwright install chromium`）は Chromium に加え **chromium-headless-shell**（および ffmpeg / winldd）を
`%LOCALAPPDATA%\ms-playwright` へ入れる。`install chromium` だけで headless-shell も含まれる。

### Cursor / エージェント環境での注意（再発しやすい）

エージェントシェルでは `PLAYWRIGHT_BROWSERS_PATH` が
`%TEMP%\cursor-sandbox-cache\...\playwright` に向いていることがある。
その状態で install すると **ユーザーの通常ターミナルからは見えない一時キャッシュ** に入り、
IDE 再起動やキャッシュ掃除後に `Executable doesn't exist` が再発する。

恒久対応（ユーザーの PowerShell・`PLAYWRIGHT_BROWSERS_PATH` を外してから入れる）:

```powershell
Remove-Item Env:PLAYWRIGHT_BROWSERS_PATH -ErrorAction SilentlyContinue
pnpm playwright:install
Get-ChildItem "$env:LOCALAPPDATA\ms-playwright"
pnpm test:e2e
```

固定アカウント: `admin@example.com` / `ChangeMe123!`
