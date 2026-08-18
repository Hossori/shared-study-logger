/**
 * アプリ全体のルート定義（data router API）。`App.tsx`から`RouterProvider`に渡す。
 *
 * - `/login`: 未ログイン専用（`GuestRoute`配下）。ログイン済みなら`/`へリダイレクト。
 * - `/`: 認証必須のメイン画面（`ProtectedRoute`配下）。未ログインなら`/login`へリダイレクト。
 * - `/users/:userId`: 認証必須のユーザーページ（自分=マイページ、他人=閲覧のみ）。
 * - `/mypage`: 自分のユーザーページへ Navigate。
 * - `/admin/notifications`: 管理者専用のアプリ内通知管理。USER は 403 画面。
 * - `/admin/groups`: 管理者専用のグループ・ユーザー管理。USER は 403 画面。
 * - それ以外の全パス: 404画面。
 */
import { createBrowserRouter } from "react-router";
import LoginPage from "../features/auth/LoginPage";
import MyPage from "../features/auth/MyPage";
import UserPage from "../features/auth/UserPage";
import GuestRoute from "./GuestRoute";
import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import HomePage from "./HomePage";
import NotFoundPage from "./NotFoundPage";
import AdminNotificationsPage from "../features/notifications/AdminNotificationsPage";
import AdminDirectoryPage from "../features/groups/AdminDirectoryPage";

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/users/:userId", element: <UserPage /> },
      { path: "/mypage", element: <MyPage /> },
      {
        element: <AdminRoute />,
        children: [
          {
            path: "/admin/notifications",
            element: <AdminNotificationsPage />,
          },
          {
            path: "/admin/groups",
            element: <AdminDirectoryPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
