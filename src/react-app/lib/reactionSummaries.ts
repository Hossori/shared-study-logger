/**
 * 記録カード上のリアクション集計を更新する純関数（楽観更新用）。
 */
import {
  REACTION_STAMPS,
  type ReactionStamp,
  type ReactionSummary,
} from "../../../shared/schemas";

const STAMP_ORDER = new Map(
  REACTION_STAMPS.map((stamp, index) => [stamp, index]),
);

export function sortReactionSummaries(
  summaries: ReactionSummary[],
): ReactionSummary[] {
  return [...summaries].sort(
    (a, b) =>
      (STAMP_ORDER.get(a.stamp) ?? 99) - (STAMP_ORDER.get(b.stamp) ?? 99),
  );
}

/** 自分が stamp を付けたあとの summaries。既に付けていればそのまま。 */
export function applyAddReaction(
  summaries: ReactionSummary[],
  stamp: ReactionStamp,
): ReactionSummary[] {
  const existing = summaries.find((item) => item.stamp === stamp);
  if (existing?.reactedByMe) {
    return summaries;
  }
  if (existing) {
    return summaries.map((item) =>
      item.stamp === stamp
        ? { ...item, count: item.count + 1, reactedByMe: true }
        : item,
    );
  }
  return sortReactionSummaries([
    ...summaries,
    { stamp, count: 1, reactedByMe: true },
  ]);
}

/** 自分の stamp を外したあとの summaries。付けていなければそのまま。 */
export function applyRemoveReaction(
  summaries: ReactionSummary[],
  stamp: ReactionStamp,
): ReactionSummary[] {
  const existing = summaries.find((item) => item.stamp === stamp);
  if (!existing?.reactedByMe) {
    return summaries;
  }
  if (existing.count <= 1) {
    return summaries.filter((item) => item.stamp !== stamp);
  }
  return summaries.map((item) =>
    item.stamp === stamp
      ? { ...item, count: item.count - 1, reactedByMe: false }
      : item,
  );
}
