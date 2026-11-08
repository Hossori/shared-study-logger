/**
 * 認証必須のメイン画面（`/`）。`ProtectedRoute` の子ルートとしてのみ描画される。
 */
import { useQueryClient } from "@tanstack/react-query";
import { useOutletContext } from "react-router";
import type { AuthenticatedOutletContext } from "@/app/guards/ProtectedRoute";
import Layout from "@/app/shell/Layout";
import { useLayoutScroll } from "@/app/shell/LayoutScrollContext";
import PullToRefresh from "@/app/shell/PullToRefresh";
import { GroupSwitcher, useSelectedGroupStore } from "@/features/groups";
import { RecordsList, recordsQueryKeys } from "@/features/records";

function HomePageContent() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();
  const { fabHost } = useLayoutScroll();
  const selectedGroupId = useSelectedGroupStore(
    (state) => state.selectedGroupId,
  );
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    if (!selectedGroupId) return;
    await queryClient.invalidateQueries({
      queryKey: recordsQueryKeys.list(selectedGroupId),
    });
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={!selectedGroupId}>
      <RecordsList
        groupId={selectedGroupId}
        currentUserId={user.id}
        toolbarStart={<GroupSwitcher />}
        fabHost={fabHost}
      />
    </PullToRefresh>
  );
}

export default function HomePage() {
  const { user } = useOutletContext<AuthenticatedOutletContext>();

  return (
    <Layout user={user}>
      <HomePageContent />
    </Layout>
  );
}
