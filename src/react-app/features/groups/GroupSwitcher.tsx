/**
 * 所属グループの切替UI（記録一覧ツールバー用セレクトボックス）。
 */
import { useEffect } from "react";
import { useGroupsQuery } from "../../queries/useGroups";
import { useUiStore } from "../../stores/uiStore";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";

export default function GroupSwitcher() {
  const { data: groups, isLoading } = useGroupsQuery();
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const setSelectedGroupId = useUiStore((state) => state.setSelectedGroupId);

  useEffect(() => {
    if (!groups || groups.length === 0) return;
    const stillExists = groups.some((group) => group.id === selectedGroupId);
    if (!selectedGroupId || !stillExists) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId, setSelectedGroupId]);

  if (isLoading) {
    return <Skeleton className="h-8 w-40" />;
  }

  if (!groups || groups.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">所属グループなし</span>
    );
  }

  if (groups.length === 1) {
    return (
      <span className="truncate text-sm font-semibold sm:text-base">
        {groups[0].name}
      </span>
    );
  }

  return (
    <NativeSelect
      value={selectedGroupId ?? ""}
      onChange={(e) => setSelectedGroupId(e.target.value)}
      aria-label="グループ切替"
      className="w-full max-w-xs"
    >
      {groups.map((group) => (
        <NativeSelectOption key={group.id} value={group.id}>
          {group.name}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}
