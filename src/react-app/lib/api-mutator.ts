import type { AxiosRequestConfig } from "axios";
import { apiClient } from "./api";

export function apiMutator<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> {
  return apiClient
    .request<T>({
      ...config,
      ...options,
      paramsSerializer: { indexes: null },
    })
    .then((response) => response.data);
}
