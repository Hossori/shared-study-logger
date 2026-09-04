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

function StampChip({
  summary,
  disabled,
  onClick,
}: {
  summary: ReactionSummary;
  disabled: boolean;
  onClick: (stamp: ReactionStamp) => void;
}) {
  const emoji = REACTION_STAMP_EMOJI[summary.stamp];
  const label = REACTION_STAMP_LABEL[summary.stamp];
  const stampNode = (
    <>
      <span className="text-base">{emoji}</span>
      <span className="text-sm">
        {summary.count > 1 ? summary.count : null}
      </span>
    </>
  );

  return (
    <Button
      variant="ghost"
      className="p-0"
      disabled={disabled}
      aria-label={`${label}のリアクションを${summary.reactedByMe ? "取り消す" : "付ける"}`}
      onClick={() => {
        onClick(summary.stamp);
      }}
    >
      {summary.reactedByMe ? (
        <Badge
          variant="ghost"
          className="text-primary border-primary rounded-full px-1 py-2.5"
        >
          {stampNode}
        </Badge>
      ) : (
        <span>{stampNode}</span>
      )}
    </Button>
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
        <div className="flex min-w-0 flex-wrap items-center gap-x-0.5">
          {record.reactions.map((summary) => (
            <StampChip
              key={summary.stamp}
              summary={summary}
              disabled={busy}
              onClick={(stamp) => {
                void toggleStamp(stamp);
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
        <PopoverContent align="end" className="w-auto">
          {listQuery.isPending ? (
            <div className="flex justify-center py-2">
              <Spinner />
            </div>
          ) : listQuery.isError ? (
            <p className="text-muted-foreground">取得に失敗しました</p>
          ) : entries.length === 0 ? (
            <p className="text-muted-foreground">
              リアクションはまだありません
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {entries.map((entry) => (
                <li
                  key={`${entry.userId}-${entry.stamp}`}
                  className="flex justify-between gap-x-4"
                >
                  <span>{entry.displayName}</span>
                  <span>{REACTION_STAMP_EMOJI[entry.stamp]}</span>
                </li>
              ))}
            </ul>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
