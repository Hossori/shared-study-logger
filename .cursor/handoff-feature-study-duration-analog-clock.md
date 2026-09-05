# 引き継ぎ: `cursor/sync-develop-analog-clock-5731`

旧ブランチ名は `cursor/study-duration-analog-clock-4a77` → `feature/study-duration-analog-clock`。`origin/develop` 取り込み済み。PR #46 は feature ブランチ向け。develop 向け PR は未作成。

UI 契約の正本は [records.md](skills/shared-study-logger-overview/reference/records.md) と [docs/data-model.md](../docs/data-model.md)。

## このブランチで終わっていること

- 学習時間: Combobox / Dialog 廃止。トリガー直下の Popover。増減（`+/-1時間` `+/-10分` `+/-5分`）とクリア。加減算は即反映。0分は表示も API も未設定 (`null`)。範囲外クリックで閉じる
- 刻みは 5分（5〜720）。`0008` の 10分 CHECK を `migrations/0009_duration_minutes_five_minute_step.sql` で更新。`0007` は `record_reactions`
- 学習日時: ドラムロール廃止。日付は Calendar + Popover、時刻はアナログ時計（外側ラベルは 13〜0）
- ラベルは `htmlFor` を持たない（フォーカス移動なし）。クリックは通常どおり届き、開いているポップアップ／モーダルは閉じる
- 学習時間ポップアップ: PC・モバイルとも範囲外クリックで閉じる

## 残作業

- `develop` 向け PR
- 本番 D1 へ `0008` と `0009` を SemVer リリースフローで適用
- 任意: `package.json` の `date-fns` は `src/` から未使用

## 入口ファイル

`DurationMinutesPicker.tsx` / `StudyDatetimePicker.tsx` / `label.tsx` / `AnalogClock.tsx` / `analogClockUtils.ts` / `recordFormUtils.ts` / `shared/schemas.ts` / `migrations/0008_*.sql` / `migrations/0009_*.sql`
