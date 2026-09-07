/**
 * 学習記録一覧のユーザーフィルタ（全員 / 自分のみ / 指定する）。
 * 「指定する」はポップアップで複数選択し、閉じたときに適用する。
 * state は親（GroupRecordsContent）が保持する controlled コンポーネント。
 * 親は `key={groupId}` でマウントし直すとリセットされる。
 */
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Spinner } from "@/components/ui/spinner";
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

function MemberMultiSelectList({
  members,
  draftUserIds,
  onDraftUserIdsChange,
}: {
  members: GroupMember[];
  draftUserIds: string[];
  onDraftUserIdsChange: Dispatch<SetStateAction<string[]>>;
}) {
  return (
    <FieldSet>
      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
        {members.map((member) => {
          const checkboxId = `records-filter-member-${member.id}`;
          const checked = draftUserIds.includes(member.id);
          return (
            <Field key={member.id} orientation="horizontal">
              <Checkbox
                id={checkboxId}
                checked={checked}
                onCheckedChange={(nextChecked) => {
                  onDraftUserIdsChange((current) => {
                    if (nextChecked === true) {
                      return current.includes(member.id)
                        ? current
                        : [...current, member.id];
                    }
                    return current.filter((id) => id !== member.id);
                  });
                }}
              />
              <FieldLabel htmlFor={checkboxId}>
                <span className="flex min-w-0 items-center gap-1.5">
                  <UserAvatar
                    avatarKey={member.avatarKey}
                    className="size-5 shrink-0"
                  />
                  <span className="truncate">{member.displayName}</span>
                </span>
              </FieldLabel>
            </Field>
          );
        })}
      </div>
    </FieldSet>
  );
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
  const specifyAnchorRef = useRef<HTMLDivElement>(null);
  const skipApplyOnCloseRef = useRef(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draftUserIds, setDraftUserIds] = useState<string[]>([]);

  const { data: members, isPending: membersPending } = useGroupMembersQuery(
    groupId,
    {
      enabled: panelOpen || mode === "specify" || pickerOpen,
    },
  );
  const showSpecifyOption = (members?.length ?? 0) > 1;

  const applyDraftAndClose = () => {
    onSpecifiedUserIdsChange(draftUserIds);
    if (draftUserIds.length === 0 && mode === "specify") {
      onModeChange("all");
    }
    setPickerOpen(false);
  };

  const openSpecifyPicker = () => {
    skipApplyOnCloseRef.current = false;
    setDraftUserIds(specifiedUserIds);
    setPickerOpen(true);
  };

  const handleModeChange = (value: unknown) => {
    if (typeof value !== "string" || value.length === 0) return;
    const next = value as RecordsFilterMode;
    if (next === "specify") {
      onModeChange(next);
      openSpecifyPicker();
      return;
    }
    skipApplyOnCloseRef.current = true;
    setPickerOpen(false);
    onModeChange(next);
  };

  const handlePickerOpenChange = (open: boolean) => {
    if (open) {
      openSpecifyPicker();
      return;
    }
    if (skipApplyOnCloseRef.current) {
      skipApplyOnCloseRef.current = false;
      setPickerOpen(false);
      return;
    }
    applyDraftAndClose();
  };

  const handlePanelToggle = () => {
    if (panelOpen) {
      if (pickerOpen && !skipApplyOnCloseRef.current) {
        applyDraftAndClose();
      } else {
        skipApplyOnCloseRef.current = true;
        setPickerOpen(false);
      }
      onPanelOpenChange(false);
      return;
    }
    onPanelOpenChange(true);
  };

  return (
    <div className="mb-4 flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit px-0 has-data-[icon=inline-start]:pl-0"
        aria-expanded={panelOpen}
        aria-controls={panelId}
        onClick={handlePanelToggle}
      >
        <ListFilter data-icon="inline-start" aria-hidden />
        表示フィルター
      </Button>

      {panelOpen ? (
        <div id={panelId} className="border-border ml-2 border-l pl-3">
          <FieldSet>
            <FieldLegend variant="label">投稿者</FieldLegend>
            <RadioGroup
              className="flex w-auto flex-row flex-wrap items-center gap-x-4 gap-y-2"
              value={mode}
              onValueChange={handleModeChange}
            >
              <FieldLabel
                className="w-fit"
                onClick={() => handleModeChange("all")}
              >
                <RadioGroupItem
                  value="all"
                  className="pointer-events-none after:hidden"
                />
                全員
              </FieldLabel>
              <FieldLabel
                className="w-fit"
                onClick={() => handleModeChange("mine")}
              >
                <RadioGroupItem
                  value="mine"
                  className="pointer-events-none after:hidden"
                />
                自分のみ
              </FieldLabel>
              {showSpecifyOption ? (
                <div ref={specifyAnchorRef} className="w-fit">
                  <FieldLabel
                    className="w-fit"
                    onClick={() => handleModeChange("specify")}
                  >
                    <RadioGroupItem
                      value="specify"
                      className="pointer-events-none after:hidden"
                    />
                    指定する
                  </FieldLabel>
                </div>
              ) : null}
            </RadioGroup>
          </FieldSet>
        </div>
      ) : null}

      {pickerOpen ? (
        <Popover open onOpenChange={handlePickerOpenChange}>
          <PopoverContent
            align="start"
            className="w-64"
            anchor={specifyAnchorRef}
          >
            <PopoverTitle>メンバーを選択</PopoverTitle>
            {membersPending || !members ? (
              <div className="flex justify-center py-2">
                <Spinner />
              </div>
            ) : (
              <MemberMultiSelectList
                members={members}
                draftUserIds={draftUserIds}
                onDraftUserIdsChange={setDraftUserIds}
              />
            )}
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}
