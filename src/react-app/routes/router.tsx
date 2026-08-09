/**
 * アプリ全体のルート定義（data router API）。`App.tsx`から`RouterProvider`に渡す。
 *
 * - `/login`: 未ログイン専用（`GuestRoute`配下）。ログイン済みなら`/`へリダイレクト。
 * - `/`: 認証必須のメイン画面（`ProtectedRoute`配下）。未ログインなら`/login`へリダイレクト。
 * - それ以外の全パス: 404画面。
 */
import { createBrowserRouter } from "react-router";
import LoginPage from "../features/auth/LoginPage";
import GuestRoute from "./GuestRoute";
import ProtectedRoute from "./ProtectedRoute";
import HomePage from "./HomePage";
import NotFoundPage from "./NotFoundPage";

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [{ path: "/", element: <HomePage /> }],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
