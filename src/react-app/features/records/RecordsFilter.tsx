/**
 * 学習記録一覧のユーザーフィルタ（全員 / 自分のみ / 指定する）。
 * 適用ボタンなし・即適用。state は親（GroupRecordsContent）が保持する controlled コンポーネント。
 * 親は `key={groupId}` でマウントし直すとリセットされる。
 */
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
import { Field, FieldDescription, FieldTitle } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import UserAvatar from "../../components/UserAvatar";
import { useGroupMembersQuery } from "../../queries/useGroups";
import type { GroupMember } from "../../../../shared/schemas";
import type { RecordsFilterMode } from "./recordsFilterUtils";

interface RecordsFilterProps {
  groupId: string;
  mode: RecordsFilterMode;
  onModeChange: (mode: RecordsFilterMode) => void;
  specifiedUserIds: string[];
  onSpecifiedUserIdsChange: (ids: string[]) => void;
  panelOpen: boolean;
  onPanelOpenChange: (open: boolean) => void;
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
  mode,
  onModeChange,
  specifiedUserIds,
  onSpecifiedUserIdsChange,
  panelOpen,
  onPanelOpenChange,
}: RecordsFilterProps) {
  const panelId = "records-filter-panel";
  const { data: members } = useGroupMembersQuery(groupId, {
    enabled: mode === "specify" || panelOpen,
  });
  const showSpecifyOption = (members?.length ?? 0) > 1;
  const badgeLabel = activeFilterBadgeLabel(mode, specifiedUserIds);

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          aria-expanded={panelOpen}
          aria-controls={panelId}
          onClick={() => onPanelOpenChange(!panelOpen)}
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
            <FieldTitle>表示する投稿者</FieldTitle>
            <ToggleGroup
              value={[mode]}
              onValueChange={(values) => {
                if (values.length === 0) return;
                onModeChange(values[0] as RecordsFilterMode);
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
                onSpecifiedUserIdsChange={onSpecifiedUserIdsChange}
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
