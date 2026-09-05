# 引き継ぎ: `cursor/sync-develop-analog-clock-5731`

旧ブランチ名は `cursor/study-duration-analog-clock-4a77` → `feature/study-duration-analog-clock`。`origin/develop` 取り込み済み。PR #46 は feature ブランチ向け。develop 向け PR は未作成。

UI 契約の正本は [records.md](skills/shared-study-logger-overview/reference/records.md) と [docs/data-model.md](../docs/data-model.md)。

## このブランチで終わっていること

- 学習時間: Combobox 廃止。クリックで入れ子 Dialog。`+/-1時間` `+/-10分` `+/-5分`、クリア、OK。加減算は即反映、OK は閉じるだけ。0分は表示も API も未設定 (`null`)
- 刻みは 5分（5〜720）。`0008` の 10分 CHECK を `migrations/0009_duration_minutes_five_minute_step.sql` で更新。`0007` は `record_reactions`
- 学習日時: ドラムロール廃止。日付は Calendar + Popover、時刻はアナログ時計（外側ラベルは 13〜0）
- ラベルクリックでは関連コントロールへフォーカスしない（共通 `Label` の preventDefault）
- 学習時間モーダル: `sm`（40rem）以上ではオーバーレイクリックで閉じない。未満では閉じる。Escape / OK は閉じる

## 残作業（クラウドエージェント向け）

- ブラウザでラベル非フォーカス・PC/モバイルの学習時間モーダル閉じを確認（ゲート通過後も画面確認が未完なら実施）
- `AnalogClock.tsx` の秒メモリがコメントアウトされている。残すか削除するか判断
- `develop` 向け PR
- 本番 D1 へ `0008` と `0009` を SemVer リリースフローで適用
- 任意: `package.json` の `date-fns` は `src/` から未使用

## 入口ファイル

`DurationMinutesPicker.tsx` / `StudyDatetimePicker.tsx` / `label.tsx` / `AnalogClock.tsx` / `analogClockUtils.ts` / `recordFormUtils.ts` / `shared/schemas.ts` / `migrations/0008_*.sql` / `migrations/0009_*.sql`
