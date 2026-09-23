/** iOS の手動インストール案内。CriOS / FxiOS / EdgiOS を Safari より先に見る（UA に Safari も含まれる）。 */
export function iosHomeScreenInstallHint(userAgent: string): string {
  if (/CriOS/i.test(userAgent)) {
    return "Chrome の共有ボタン →「ホーム画面に追加」";
  }
  if (/FxiOS/i.test(userAgent)) {
    return "Firefox の共有ボタン →「ホーム画面に追加」";
  }
  if (/EdgiOS/i.test(userAgent)) {
    return "Edge の共有ボタン →「ホーム画面に追加」";
  }
  if (/Safari/i.test(userAgent) && !/Chrome|Chromium/i.test(userAgent)) {
    return "Safari の共有ボタン →「ホーム画面に追加」";
  }
  return "ブラウザの共有ボタン →「ホーム画面に追加」";
}
