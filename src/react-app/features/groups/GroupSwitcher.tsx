/**
 * 所属グループの切替UI（記録一覧ツールバー用）。
 * 複数所属時はドロップダウン、1件のみならグループ名の表示だけにする。
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useGroupsQuery } from "../../queries/useGroups";
import { useUiStore } from "../../stores/uiStore";
import {
  parseQueryGroupId,
  persistSelectedGroupId,
  readStoredSelectedGroupId,
  resolveSelectedGroupId,
  SELECTED_GROUP_QUERY_KEY,
} from "../../lib/selectedGroup";
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

function buildSearchParamsWithGroup(
  current: URLSearchParams,
  groupId: string | null,
): URLSearchParams {
  const next = new URLSearchParams(current);
  if (groupId === null) {
    next.delete(SELECTED_GROUP_QUERY_KEY);
  } else {
    next.set(SELECTED_GROUP_QUERY_KEY, groupId);
  }
  return next;
}

export default function GroupSwitcher() {
  const { data: groups, isLoading, isError } = useGroupsQuery();
  const selectedGroupId = useUiStore((state) => state.selectedGroupId);
  const setSelectedGroupId = useUiStore((state) => state.setSelectedGroupId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (groups == null || isError) return;

    if (groups.length === 0) {
      if (selectedGroupId !== null) {
        setSelectedGroupId(null);
      }
      if (readStoredSelectedGroupId() !== null) {
        persistSelectedGroupId(null);
      }
      const urlGroupId = parseQueryGroupId(
        searchParams.get(SELECTED_GROUP_QUERY_KEY),
      );
      if (urlGroupId !== null) {
        setSearchParams(buildSearchParamsWithGroup(searchParams, null), {
          replace: true,
        });
      }
      return;
    }

    const membershipIds = groups.map((group) => group.id);
    const urlGroupId = parseQueryGroupId(
      searchParams.get(SELECTED_GROUP_QUERY_KEY),
    );
    const storedGroupId = readStoredSelectedGroupId();
    const resolved = resolveSelectedGroupId(
      membershipIds,
      urlGroupId,
      storedGroupId,
    );

    if (selectedGroupId !== resolved) {
      setSelectedGroupId(resolved);
    }
    if (storedGroupId !== resolved) {
      persistSelectedGroupId(resolved);
    }
    if (urlGroupId !== resolved) {
      setSearchParams(buildSearchParamsWithGroup(searchParams, resolved), {
        replace: true,
      });
    }
  }, [
    groups,
    isError,
    isLoading,
    searchParams,
    selectedGroupId,
    setSearchParams,
    setSelectedGroupId,
  ]);

  if (isLoading) {
    return <Skeleton className="h-8 w-40" />;
  }

  if (groups == null || isError) {
    return (
      <span className="text-muted-foreground text-sm">
        グループを読み込めません
      </span>
    );
  }

  if (groups.length === 0) {
    return (
      <span className="text-muted-foreground text-sm">所属グループなし</span>
    );
  }

  const selectedGroupName =
    (selectedGroupId
      ? groups.find((group) => group.id === selectedGroupId)?.name
      : groups[0].name) ?? "";

  const handleGroupChange = (value: string) => {
    if (!value) return;
    setSelectedGroupId(value);
    persistSelectedGroupId(value);
    setSearchParams(buildSearchParamsWithGroup(searchParams, value), {
      replace: true,
    });
    setMenuOpen(false);
  };

  return (
    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold sm:text-base">
      <span className="truncate">{selectedGroupName}</span>
      {groups.length > 1 && (
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger aria-label="グループ切替">
            <Badge variant="outline" className="gap-1">
              <span className="text-muted-foreground">切り替え</span>
              <ChevronsUpDown className="text-muted-foreground" />
            </Badge>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[80dvw] max-w-[80dvw] sm:w-72 sm:max-w-72">
            <DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={selectedGroupId ?? groups[0].id}
                onValueChange={handleGroupChange}
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
