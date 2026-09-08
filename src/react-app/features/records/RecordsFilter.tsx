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
import { Field, FieldLegend, FieldSet } from "@/components/ui/field";
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
      <div className="flex max-h-64 min-w-0 flex-col gap-2 overflow-y-auto">
        {members.map((member) => {
          const checkboxId = `records-filter-member-${member.id}`;
          const checked = draftUserIds.includes(member.id);
          return (
            <Field key={member.id} orientation="horizontal" className="min-w-0">
              <Checkbox
                id={checkboxId}
                checked={checked}
                onCheckedChange={(next) => {
                  onDraftUserIdsChange((current) => {
                    const selected = next === true;
                    if (selected) {
                      return current.includes(member.id)
                        ? current
                        : [...current, member.id];
                    }
                    return current.filter((id) => id !== member.id);
                  });
                }}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <UserAvatar
                    avatarKey={member.avatarKey}
                    className="size-5 shrink-0"
                  />
                  <span className="truncate">{member.displayName}</span>
                </span>
              </Checkbox>
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
  const ignoreNextPickerCloseRef = useRef(false);
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
    if (draftUserIds.length === 0) {
      onSpecifiedUserIdsChange([]);
      if (mode === "specify") {
        onModeChange("all");
      }
    } else {
      onSpecifiedUserIdsChange(draftUserIds);
      onModeChange("specify");
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
    if (ignoreNextPickerCloseRef.current) {
      ignoreNextPickerCloseRef.current = false;
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
    <div className="mb-3 flex flex-col gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit px-0 hover:bg-transparent has-data-[icon=inline-start]:pl-0 aria-expanded:bg-transparent dark:hover:bg-transparent"
        aria-expanded={panelOpen}
        aria-controls={panelId}
        onClick={handlePanelToggle}
      >
        <ListFilter data-icon="inline-start" aria-hidden />
        表示フィルター
      </Button>

      {panelOpen ? (
        <div
          id={panelId}
          className="border-border mb-2 ml-2 border-l pl-3 text-[0.8rem] **:data-[slot=field-legend]:text-[0.8rem]"
        >
          <FieldSet>
            <FieldLegend variant="label">投稿者</FieldLegend>
            <RadioGroup
              className="flex w-auto flex-row flex-wrap items-center gap-x-4 gap-y-2"
              value={pickerOpen ? "specify" : mode}
              onValueChange={handleModeChange}
            >
              <div
                onPointerDownCapture={() => {
                  if (pickerOpen) skipApplyOnCloseRef.current = true;
                }}
              >
                <RadioGroupItem value="all">全員</RadioGroupItem>
              </div>
              <div
                onPointerDownCapture={() => {
                  if (pickerOpen) skipApplyOnCloseRef.current = true;
                }}
              >
                <RadioGroupItem value="mine">自分のみ</RadioGroupItem>
              </div>
              {showSpecifyOption ? (
                <div
                  ref={specifyAnchorRef}
                  className="w-fit"
                  onClickCapture={() => {
                    if (mode === "specify" && !pickerOpen) {
                      ignoreNextPickerCloseRef.current = true;
                      openSpecifyPicker();
                    }
                  }}
                >
                  <RadioGroupItem value="specify">指定する</RadioGroupItem>
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
            className="w-64 text-[0.8rem]"
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
