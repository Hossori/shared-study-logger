/**
 * `/api/*` へのaxiosラッパー。同一オリジンAPIのため`withCredentials: true`を必須にし、
 * Cookie認証を常に送信する。非2xxレスポンスはレスポンスインターセプターで`ApiError`に変換する。
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `API request failed with status ${status}`,
    );
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

const client = axios.create({
  baseURL: "/",
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

// リクエストにボディがある場合のみ`Content-Type: application/json`を付与する
// （元のfetchラッパーの挙動を踏襲）。axiosはデフォルトでプレーンオブジェクトのボディに
// このヘッダーを自動付与するが、挙動を明示するためにここで設定している。
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (config.data !== undefined) {
    config.headers.set("Content-Type", "application/json");
  }
  return config;
});

// 非2xxレスポンス（および接続エラー等)を、呼び出し側が既に依存している`ApiError`
// （`status`/`body`を持つ）に変換して再throwする。学習記録アプリではAxiosErrorを
// そのまま各画面に伝播させず、この層で吸収するのがポイント。
client.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        return Promise.reject(
          new ApiError(axiosError.response.status, axiosError.response.data),
        );
      }
      // タイムアウト・オフライン等、レスポンス自体を受け取れなかった場合。
      return Promise.reject(
        new ApiError(0, { error: axiosError.message || "Network Error" }),
      );
    }
    return Promise.reject(error);
  },
);

export function apiGet<T>(path: string): Promise<T> {
  return client.get<T>(path).then((response) => response.data);
}

export function apiPost<T>(path: string, data?: unknown): Promise<T> {
  return client.post<T>(path, data).then((response) => response.data);
}

export function apiDelete<T>(path: string, data?: unknown): Promise<T> {
  return client.delete<T>(path, { data }).then((response) => response.data);
}
