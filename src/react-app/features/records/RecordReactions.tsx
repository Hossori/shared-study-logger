/**
 * 学習記録カード下部のリアクション（スタンプ付与・件数・ユーザー一覧）。
 * 件数は楽観更新。同種が1件のときは件数を出さず、スタンプ同士は詰めて並べる。
 * 付与済みスタンプの長押しで、リアクションしたユーザー一覧を表示する。
 * 一覧は指を離しても開いたままで、他箇所クリックまたは Escape で閉じる。
 */
import { useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
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

const LONG_PRESS_MS = 500;

interface RecordReactionsProps {
  groupId: string;
  record: StudyRecord;
}

function StampChip({
  summary,
  disabled,
  onClick,
  onLongPress,
}: {
  summary: ReactionSummary;
  disabled: boolean;
  onClick: (stamp: ReactionStamp) => void;
  onLongPress: (anchor: HTMLElement) => void;
}) {
  const timerRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
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

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <Button
      variant="ghost"
      className="p-0"
      disabled={disabled}
      aria-haspopup="dialog"
      aria-label={`${label}のリアクションを${summary.reactedByMe ? "取り消す" : "付ける"}`}
      title="長押しでリアクションしたユーザーを表示"
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        clearTimer();
        suppressClickRef.current = false;
        const target = event.currentTarget;
        event.currentTarget.setPointerCapture(event.pointerId);
        timerRef.current = window.setTimeout(() => {
          timerRef.current = null;
          suppressClickRef.current = true;
          onLongPress(target);
        }, LONG_PRESS_MS);
      }}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      onLostPointerCapture={clearTimer}
      onContextMenu={(event) => {
        event.preventDefault();
      }}
      onClick={() => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onClick(summary.stamp);
      }}
    >
      {summary.reactedByMe ? (
        <Badge
          variant="ghost"
          className="text-primary border-primary rounded-full px-1 py-3"
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
  const [listAnchor, setListAnchor] = useState<Element | null>(null);
  // 長押しの pointerup が outside-press になるのを、同じジェスチャが終わるまで無視する。
  const listDismissLockedRef = useRef(false);
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

  const openReactionUserList = (anchor: HTMLElement) => {
    listDismissLockedRef.current = true;
    setListAnchor(anchor);
    setListOpen(true);

    const unlock = () => {
      window.removeEventListener("pointerup", unlock);
      window.removeEventListener("pointercancel", unlock);
      window.setTimeout(() => {
        listDismissLockedRef.current = false;
      }, 0);
    };
    window.addEventListener("pointerup", unlock);
    window.addEventListener("pointercancel", unlock);
  };

  const handleListOpenChange = (
    open: boolean,
    eventDetails: { cancel: () => void },
  ) => {
    if (!open && listDismissLockedRef.current) {
      eventDetails.cancel();
      return;
    }
    setListOpen(open);
    if (!open) {
      setListAnchor(null);
    }
  };

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
              onLongPress={openReactionUserList}
            />
          ))}
        </div>
      ) : null}

      <Popover open={listOpen} onOpenChange={handleListOpenChange}>
        <PopoverContent align="start" className="w-auto" anchor={listAnchor}>
          <PopoverTitle className="sr-only">
            リアクションしたユーザー
          </PopoverTitle>
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
