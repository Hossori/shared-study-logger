# E2E（Playwright スモーク）

詳細方針は[`.cursor/skills/testing-strategy/SKILL.md`](../.cursor/skills/testing-strategy/SKILL.md)。

## 前提

```bash
pnpm exec wrangler d1 migrations apply shared-study-logger-db --local
pnpm seed
# .dev.vars に VAPID_* があること（README 参照）
pnpm playwright:install
pnpm test:e2e
```

`PLAYWRIGHT_BROWSERS_PATH` が未設定の場合、`pnpm playwright:install`（`playwright install chromium`）は Chromium に加え
**chromium-headless-shell**（および ffmpeg / winldd）を `%LOCALAPPDATA%\ms-playwright` へ入れる。
`install chromium` だけで headless-shell も含まれる。

### Cursor / エージェント環境での注意

エージェントシェルでは `PLAYWRIGHT_BROWSERS_PATH` が `%TEMP%\cursor-sandbox-cache\...\playwright` に向いていることがある。
この一時キャッシュは IDE の再起動やキャッシュ掃除後に失われる可能性があるため、エージェントシェルでの install を通常端末用の恒久的な準備として扱わない。

通常の開発・ローカル E2E は、ユーザーの PowerShell で `PLAYWRIGHT_BROWSERS_PATH` を外し、Playwright の既定キャッシュへ install / test を行う:

```powershell
Remove-Item Env:PLAYWRIGHT_BROWSERS_PATH -ErrorAction SilentlyContinue
pnpm playwright:install
pnpm test:e2e
```

エージェント内で E2E を実行する必要がある場合は、同じエージェントセッション内で `pnpm playwright:install` の後に `pnpm test:e2e` を実行する。
一時キャッシュをセッションをまたいで利用できる前提にはしない。

固定アカウント: `admin@example.com` / `ChangeMe123!`
