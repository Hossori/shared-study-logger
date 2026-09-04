/**
 * 学習記録カード下部のリアクション（スタンプ付与・件数・ユーザー一覧）。
 * 件数は楽観更新。同種が1件のときはバッジを出さず、スタンプ同士は詰めて並べる。
 */
import { useState } from "react";
import { List, SmilePlus } from "lucide-react";
import {
  REACTION_STAMP_EMOJI,
  REACTION_STAMP_LABEL,
  REACTION_STAMPS,
  type ReactionStamp,
  type ReactionSummary,
  type StudyRecord,
} from "../../../../shared/schemas";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import {
  useAddRecordReactionMutation,
  useDeleteRecordReactionMutation,
  useRecordReactionsQuery,
} from "../../queries/useRecords";

interface RecordReactionsProps {
  groupId: string;
  record: StudyRecord;
}

function CountBadge({ count }: { count: number }) {
  if (count <= 1) return null;
  return (
    <Badge variant="secondary" className="h-4 min-w-4 px-1">
      {count}
    </Badge>
  );
}

function StampChip({
  summary,
  disabled,
  onRemoveOwn,
}: {
  summary: ReactionSummary;
  disabled: boolean;
  onRemoveOwn: (stamp: ReactionStamp) => void;
}) {
  const emoji = REACTION_STAMP_EMOJI[summary.stamp];
  const label = REACTION_STAMP_LABEL[summary.stamp];
  const showCount = summary.count > 1;
  const emojiNode = <span aria-hidden>{emoji}</span>;
  const countNode = <CountBadge count={summary.count} />;

  if (summary.reactedByMe) {
    return (
      <Button
        variant="ghost"
        size={showCount ? "sm" : "icon-sm"}
        disabled={disabled}
        aria-label={`${label}のリアクションを取り消す`}
        className={cn(showCount && "h-7 min-w-7 gap-0.5 px-1")}
        onClick={() => {
          onRemoveOwn(summary.stamp);
        }}
      >
        {emojiNode}
        {countNode}
      </Button>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        showCount ? "h-7 min-w-7 gap-0.5 px-1" : "size-7",
      )}
      aria-label={showCount ? `${label} ${summary.count}件` : `${label} 1件`}
    >
      {emojiNode}
      {countNode}
    </span>
  );
}

export default function RecordReactions({
  groupId,
  record,
}: RecordReactionsProps) {
  const [listOpen, setListOpen] = useState(false);
  const addMutation = useAddRecordReactionMutation(groupId);
  const deleteMutation = useDeleteRecordReactionMutation(groupId);
  const listQuery = useRecordReactionsQuery(groupId, record.id, listOpen);
  const busy = addMutation.isPending || deleteMutation.isPending;

  const reactedByMe = new Set(
    record.reactions
      .filter((item) => item.reactedByMe)
      .map((item) => item.stamp),
  );

  const toggleStamp = async (stamp: ReactionStamp) => {
    if (busy) return;
    try {
      if (reactedByMe.has(stamp)) {
        await deleteMutation.mutateAsync({ recordId: record.id, stamp });
      } else {
        await addMutation.mutateAsync({ recordId: record.id, stamp });
      }
    } catch {
      // 失敗時は onError でキャッシュを戻す。
    }
  };

  const removeOwn = async (stamp: ReactionStamp) => {
    if (busy) return;
    try {
      await deleteMutation.mutateAsync({ recordId: record.id, stamp });
    } catch {
      // 失敗時は onError でキャッシュを戻す。
    }
  };

  const entries = listQuery.data?.reactions ?? [];

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-0.5">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="リアクションを付ける"
            />
          }
        >
          <SmilePlus aria-hidden />
          <span className="sr-only">リアクションを付ける</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto" align="start">
          <PopoverTitle className="sr-only">リアクションを付ける</PopoverTitle>
          <div className="flex gap-0.5">
            {REACTION_STAMPS.map((stamp) => {
              const mine = reactedByMe.has(stamp);
              const label = REACTION_STAMP_LABEL[stamp];
              return (
                <Button
                  key={stamp}
                  variant="ghost"
                  size="icon"
                  disabled={busy}
                  aria-label={mine ? `${label}を取り消す` : `${label}を付ける`}
                  aria-pressed={mine}
                  className={cn(mine ? "text-2xl" : "text-lg")}
                  onClick={() => {
                    void toggleStamp(stamp);
                  }}
                >
                  <span aria-hidden>{REACTION_STAMP_EMOJI[stamp]}</span>
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {record.reactions.length > 0 ? (
        <div className="flex min-w-0 flex-wrap items-center">
          {record.reactions.map((summary) => (
            <StampChip
              key={summary.stamp}
              summary={summary}
              disabled={busy}
              onRemoveOwn={(stamp) => {
                void removeOwn(stamp);
              }}
            />
          ))}
        </div>
      ) : null}

      <Popover open={listOpen} onOpenChange={setListOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="リアクションしたユーザー"
            />
          }
        >
          <List aria-hidden />
          <span className="sr-only">リアクションしたユーザー</span>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56">
          <PopoverTitle>リアクションしたユーザー</PopoverTitle>
          {listQuery.isPending ? (
            <div className="flex justify-center py-2">
              <Spinner />
            </div>
          ) : listQuery.isError ? (
            <p className="text-muted-foreground">取得に失敗しました</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">まだありません</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {entries.map((entry) => (
                <li key={`${entry.userId}-${entry.stamp}`}>
                  {REACTION_STAMP_EMOJI[entry.stamp]} {entry.displayName}
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
