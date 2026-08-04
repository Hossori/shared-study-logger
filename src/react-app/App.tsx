import { useMeQuery } from "./queries/useAuth";
import LoginPage from "./features/auth/LoginPage";
import Layout from "./components/Layout";
import RecordsList from "./features/records/RecordsList";
import PostRecordModal from "./features/records/PostRecordModal";

function App() {
	const { data: user, isLoading } = useMeQuery();

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-gray-50">
				<p className="text-sm text-gray-400">読み込み中...</p>
			</div>
		);
	}

	if (!user) {
		return <LoginPage />;
	}

	return (
		<Layout user={user}>
			{/* Layout内ヘッダーにもGroupSwitcherがあるが、ここではメインコンテンツとして
			    選択中グループの記録一覧を表示する。GroupSwitcher自体はLayoutのヘッダーに配置。 */}
			<RecordsList />
			<PostRecordModal />
		</Layout>
	);
}

export default App;
