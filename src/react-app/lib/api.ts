/**
 * `/api/*` へのaxiosラッパー。同一オリジンAPIのため`withCredentials: true`を必須にし、
 * Cookie認証を常に送信する。非2xxレスポンスはレスポンスインターセプターで`ApiError`に変換する。
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  CLIENT_API_VERSION,
  CLIENT_API_VERSION_HEADER,
} from "../../../shared/client-api-version";
import {
  getClientApiUpdateRequiredEvent,
  notifyClientApiUpdateRequired,
} from "./clientApiUpdateRequired";

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

/**
 * 現在のクライアントが API 契約上サポート外であることを表すエラー。
 * 通常の`ApiError`を継承するため、既存のエラーハンドリングも維持される。
 */
export class ClientUpdateRequiredError extends ApiError {
  constructor(body: unknown) {
    super(426, body);
    this.name = "ClientUpdateRequiredError";
  }
}

const REQUEST_TIMEOUT_MS = 10_000;

export const apiClient = axios.create({
  baseURL: "/",
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

// リクエストにボディがある場合のみ`Content-Type: application/json`を付与する。
// axiosはデフォルトでプレーンオブジェクトのボディにこのヘッダーを自動付与するが、挙動を明示するためにここで設定している。
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const updateRequiredEvent = getClientApiUpdateRequiredEvent();
  if (updateRequiredEvent) {
    return Promise.reject(
      new ClientUpdateRequiredError(updateRequiredEvent.body),
    );
  }

  config.headers.set(CLIENT_API_VERSION_HEADER, CLIENT_API_VERSION);
  if (config.data !== undefined) {
    config.headers.set("Content-Type", "application/json");
  }
  return config;
});

// 非2xxレスポンス（および接続エラー等)を、呼び出し側が既に依存している`ApiError`
// （`status`/`body`を持つ）に変換して再throwする。学習記録アプリではAxiosErrorを
// そのまま各画面に伝播させず、この層で吸収するのがポイント。
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const { status, data } = axiosError.response;
        if (
          status === 426 &&
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          data.error === "client_update_required"
        ) {
          notifyClientApiUpdateRequired({ status: 426, body: data });
          return Promise.reject(new ClientUpdateRequiredError(data));
        }
        return Promise.reject(new ApiError(status, data));
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
  return apiClient.get<T>(path).then((response) => response.data);
}

export function apiPost<T>(path: string, data?: unknown): Promise<T> {
  return apiClient.post<T>(path, data).then((response) => response.data);
}

export function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  return apiClient.patch<T>(path, data).then((response) => response.data);
}

export function apiDelete<T>(path: string, data?: unknown): Promise<T> {
  return apiClient.delete<T>(path, { data }).then((response) => response.data);
}
