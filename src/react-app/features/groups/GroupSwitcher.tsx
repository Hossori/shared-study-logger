/**
 * 所属グループの切替UI（記録一覧ツールバー用セレクトボックス）。
 */
import { useEffect } from "react";
import { useGroupsQuery } from "../../queries/useGroups";
import { useUiStore } from "../../stores/uiStore";

const selectClassName =
  "w-full max-w-xs cursor-pointer truncate rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-base";

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
    return <span className="text-sm text-gray-400">読み込み中...</span>;
  }

  if (!groups || groups.length === 0) {
    return <span className="text-sm text-gray-400">所属グループなし</span>;
  }

  if (groups.length === 1) {
    return (
      <span className="truncate text-sm font-semibold text-gray-800 sm:text-base">
        {groups[0].name}
      </span>
    );
  }

  return (
    <select
      value={selectedGroupId ?? ""}
      onChange={(e) => setSelectedGroupId(e.target.value)}
      className={selectClassName}
      aria-label="グループ切替"
    >
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </select>
  );
}
