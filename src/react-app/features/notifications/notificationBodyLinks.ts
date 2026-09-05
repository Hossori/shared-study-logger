import { toSafeHttpHttpsUrl } from "../../../../shared/schemas";

export const MARKDOWN_LINK_SNIPPET = "[]()";
export const MARKDOWN_LINK_CURSOR_OFFSET = 1;

const LINK_RE = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/gi;

export type NotificationBodyPart =
  | { type: "text"; text: string }
  | { type: "link"; href: string; label: string };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 選択なし: カーソル位置に `[]()` を挿入し、カーソルは `[]` の中へ。
 * 選択あり: 選択文字列を `[selected]()` で囲み、カーソルは `()` の内側へ。
 */
export function insertMarkdownLinkSnippet(
  value: string,
  start: number,
  end: number,
): { value: string; cursor: number } {
  const from = clamp(start, 0, value.length);
  const to = clamp(Math.max(start, end), from, value.length);

  if (from === to) {
    return {
      value: `${value.slice(0, from)}${MARKDOWN_LINK_SNIPPET}${value.slice(to)}`,
      cursor: from + MARKDOWN_LINK_CURSOR_OFFSET,
    };
  }

  const selected = value.slice(from, to);
  const wrapped = `[${selected}]()`;
  return {
    value: `${value.slice(0, from)}${wrapped}${value.slice(to)}`,
    cursor: from + selected.length + 3,
  };
}

export function parseNotificationBody(body: string): NotificationBodyPart[] {
  const parts: NotificationBodyPart[] = [];
  let lastIndex = 0;
  LINK_RE.lastIndex = 0;

  for (const match of body.matchAll(LINK_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ type: "text", text: body.slice(lastIndex, index) });
    }

    const rawLabel = match[1] ?? "";
    const rawUrl = (match[2] ?? "").trim();
    const href = toSafeHttpHttpsUrl(rawUrl);
    if (href) {
      parts.push({
        type: "link",
        href,
        label: rawLabel.trim() === "" ? rawUrl : rawLabel,
      });
    } else {
      parts.push({ type: "text", text: match[0] });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", text: body.slice(lastIndex) });
  }

  return parts;
}
