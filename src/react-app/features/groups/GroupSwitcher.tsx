/**
 * 所属グループの切替UI（記録一覧ツールバー用）。
 * 複数所属時はドロップダウン、1件のみならグループ名の表示だけにする。
 */
import { useEffect } from "react";
import { useGroupsQuery } from "../../queries/useGroups";
import { useUiStore } from "../../stores/uiStore";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronsUpDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

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

  const selectedGroupName =
    (selectedGroupId
      ? groups.find((group) => group.id === selectedGroupId)?.name
      : groups[0].name) ?? "";

  return (
    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:text-base">
      <span className="truncate">{selectedGroupName}</span>
      {groups.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger aria-label="グループ切替">
            <Badge variant="outline">
              <span className="text-muted-foreground">切り替え</span>
              <ChevronsUpDown className="text-muted-foreground" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-w-4/5 min-w-fit">
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={selectedGroupId ?? groups[0].id}
                onValueChange={(value: string) => {
                  if (value) setSelectedGroupId(value);
                }}
              >
                {groups.map((group) => (
                  <DropdownMenuRadioItem key={group.id} value={group.id}>
                    {group.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  );
}
