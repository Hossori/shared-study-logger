/**
 * 学習記録一覧のユーザーフィルタ（全員 / 自分のみ / 指定する）。
 * 適用ボタンなし・即適用。state はコンポーネント内（Zustand 禁止）。
 * 親は `key={groupId}` でマウントし直すとリセットされる。
 */
import { useEffect, useState } from "react";
import { ListFilter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import UserAvatar from "../../components/UserAvatar";
import { useGroupMembersQuery } from "../../queries/useGroups";
import type { GroupMember } from "../../../../shared/schemas";

export type RecordsFilterMode = "all" | "mine" | "specify";

function computeEffectiveUserIds(
  mode: RecordsFilterMode,
  specifiedUserIds: string[],
  meId: string | undefined,
): string[] | undefined {
  if (mode === "all") return undefined;
  if (mode === "mine") return meId ? [meId] : undefined;
  if (mode === "specify" && specifiedUserIds.length >= 1) {
    return specifiedUserIds;
  }
  return undefined;
}

interface RecordsFilterProps {
  groupId: string;
  meId: string | undefined;
  onEffectiveUserIdsChange: (userIds: string[] | undefined) => void;
  onQueryEnabledChange: (enabled: boolean) => void;
}

function MemberSelectDropdown({
  members,
  specifiedUserIds,
  onSpecifiedUserIdsChange,
}: {
  members: GroupMember[];
  specifiedUserIds: string[];
  onSpecifiedUserIdsChange: (ids: string[]) => void;
}) {
  const selectedMembers = members.filter((m) =>
    specifiedUserIds.includes(m.id),
  );
  const triggerLabel =
    selectedMembers.length === 0
      ? "メンバーを選択"
      : selectedMembers.length === 1
        ? selectedMembers[0]!.displayName
        : `${selectedMembers.length}人`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="max-w-full justify-start" />
        }
      >
        {selectedMembers.length === 1 ? (
          <UserAvatar
            avatarKey={selectedMembers[0]!.avatarKey}
            className="size-5 shrink-0"
          />
        ) : null}
        <span className="truncate">{triggerLabel}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>メンバー</DropdownMenuLabel>
          {members.map((member) => (
            <DropdownMenuCheckboxItem
              key={member.id}
              checked={specifiedUserIds.includes(member.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  onSpecifiedUserIdsChange([...specifiedUserIds, member.id]);
                } else {
                  onSpecifiedUserIdsChange(
                    specifiedUserIds.filter((id) => id !== member.id),
                  );
                }
              }}
            >
              <UserAvatar
                avatarKey={member.avatarKey}
                className="size-5 shrink-0"
              />
              <span className="truncate">{member.displayName}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function activeFilterBadgeLabel(
  mode: RecordsFilterMode,
  specifiedUserIds: string[],
): string | null {
  if (mode === "mine") return "自分のみ";
  if (mode === "specify" && specifiedUserIds.length >= 1) {
    return specifiedUserIds.length === 1
      ? "指定する"
      : `${specifiedUserIds.length}人`;
  }
  return null;
}

export default function RecordsFilter({
  groupId,
  meId,
  onEffectiveUserIdsChange,
  onQueryEnabledChange,
}: RecordsFilterProps) {
  const [mode, setMode] = useState<RecordsFilterMode>("all");
  const [specifiedUserIds, setSpecifiedUserIds] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const panelId = "records-filter-panel";
  const { data: members } = useGroupMembersQuery(groupId, {
    enabled: mode === "specify" || panelOpen,
  });
  const showSpecifyOption = (members?.length ?? 0) > 1;
  const badgeLabel = activeFilterBadgeLabel(mode, specifiedUserIds);

  const effectiveUserIds = computeEffectiveUserIds(
    mode,
    specifiedUserIds,
    meId,
  );
  const queryEnabled = mode !== "mine" || meId !== undefined;

  useEffect(() => {
    onEffectiveUserIdsChange(effectiveUserIds);
  }, [effectiveUserIds, onEffectiveUserIdsChange]);

  useEffect(() => {
    onQueryEnabledChange(queryEnabled);
  }, [queryEnabled, onQueryEnabledChange]);

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          aria-expanded={panelOpen}
          aria-controls={panelId}
          onClick={() => setPanelOpen(!panelOpen)}
        >
          <ListFilter data-icon="inline-start" aria-hidden />
          絞り込み
        </Button>
        {!panelOpen && badgeLabel ? (
          <Badge variant="secondary">{badgeLabel}</Badge>
        ) : null}
      </div>

      {panelOpen ? (
        <div id={panelId} className="flex flex-col gap-3">
          <Separator />
          <Field>
            <ToggleGroup
              value={[mode]}
              onValueChange={(values) => {
                if (values.length === 0) return;
                setMode(values[0] as RecordsFilterMode);
              }}
            >
              <ToggleGroupItem value="all">全員</ToggleGroupItem>
              <ToggleGroupItem value="mine">自分のみ</ToggleGroupItem>
              {showSpecifyOption ? (
                <ToggleGroupItem value="specify">指定する</ToggleGroupItem>
              ) : null}
            </ToggleGroup>
          </Field>

          {mode === "specify" && showSpecifyOption && members ? (
            <Field>
              <MemberSelectDropdown
                members={members}
                specifiedUserIds={specifiedUserIds}
                onSpecifiedUserIdsChange={setSpecifiedUserIds}
              />
              <FieldDescription>
                1人以上選ぶと絞り込みます。未選択のときは全員分を表示します。
              </FieldDescription>
            </Field>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
