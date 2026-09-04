# 引き継ぎ: `feature/study-duration-analog-clock`

旧ブランチ名は `cursor/study-duration-analog-clock-4a77`。`develop` から分岐。PR は未作成。

UI 契約の正本は [records.md](skills/shared-study-logger-overview/reference/records.md) と [docs/data-model.md](../docs/data-model.md)。

## このブランチで終わっていること

- 学習時間: Combobox 廃止。クリックで入れ子 Dialog。`+/-1時間` `+/-10分` `+/-5分`、クリア、OK。加減算は即反映、OK は閉じるだけ。0分は表示も API も未設定 (`null`)
- 刻みは 5分（5〜720）。`0007` の 10分 CHECK を `migrations/0008_duration_minutes_five_minute_step.sql` で更新
- 学習日時: ドラムロール廃止。日付は Calendar + Popover、時刻はアナログ時計（外側ラベルは 13〜24）

## 残作業

- `develop` 向け PR
- 本番 D1 へ `0008` を SemVer リリースフローで適用
- 任意: `package.json` の `date-fns` は `src/` から未使用

## 入口ファイル

`DurationMinutesPicker.tsx` / `StudyDatetimePicker.tsx` / `recordFormUtils.ts` / `shared/schemas.ts` / `migrations/0008_*.sql`
