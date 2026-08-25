import {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it } from "vitest";
import {
  CLIENT_API_VERSION,
  CLIENT_API_VERSION_HEADER,
  compareClientApiVersions,
  isClientApiVersionSupported,
  parseClientApiVersion,
} from "../../shared/client-api-version";
import {
  apiClient,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  ClientUpdateRequiredError,
} from "../../src/react-app/lib/api";
import {
  subscribeClientApiUpdateRequired,
  type ClientApiUpdateRequiredEvent,
} from "../../src/react-app/lib/clientApiUpdateRequired";

const originalAdapter = apiClient.defaults.adapter;

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
});

function successfulResponse(
  config: InternalAxiosRequestConfig,
): AxiosResponse<{ ok: true }> {
  return {
    data: { ok: true },
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  };
}

describe("client API version contract", () => {
  it("parses and compares strict semantic versions", () => {
    expect(parseClientApiVersion("1.2.3")).toEqual([1, 2, 3]);
    expect(parseClientApiVersion("1.02.3")).toBeNull();
    expect(parseClientApiVersion("1.2")).toBeNull();
    expect(parseClientApiVersion("1.2.3-beta.1")).toBeNull();
    expect(compareClientApiVersions("2.0.0", "1.99.99")).toBe(1);
    expect(compareClientApiVersions("1.2.3", "1.2.3")).toBe(0);
    expect(compareClientApiVersions("1.2.3", "1.2.4")).toBe(-1);
    expect(compareClientApiVersions("invalid", "1.0.0")).toBeNull();
  });

  it("enforces the current minimum while allowing an explicit bridge opt-out", () => {
    expect(isClientApiVersionSupported(CLIENT_API_VERSION)).toBe(true);
    expect(isClientApiVersionSupported("1.9.9")).toBe(false);
    expect(isClientApiVersionSupported("invalid", null)).toBe(true);
    expect(isClientApiVersionSupported("1.1.0", "1.0.0")).toBe(true);
    expect(isClientApiVersionSupported("0.9.9", "1.0.0")).toBe(false);
    expect(isClientApiVersionSupported("invalid", "1.0.0")).toBe(false);
  });
});

describe("API client version contract", () => {
  it("attaches the API version header to every helper request", async () => {
    const receivedConfigs: InternalAxiosRequestConfig[] = [];
    apiClient.defaults.adapter = async (config) => {
      receivedConfigs.push(config);
      return successfulResponse(config);
    };

    await Promise.all([
      apiGet("/api/get"),
      apiPost("/api/post", { value: "post" }),
      apiPatch("/api/patch", { value: "patch" }),
      apiDelete("/api/delete", { value: "delete" }),
    ]);

    expect(receivedConfigs).toHaveLength(4);
    for (const config of receivedConfigs) {
      expect(config.headers.get(CLIENT_API_VERSION_HEADER)).toBe(
        CLIENT_API_VERSION,
      );
    }
  });

  it("notifies subscribers and rejects a dedicated error for client_update_required", async () => {
    const body = { error: "client_update_required" };
    let event: ClientApiUpdateRequiredEvent | undefined;
    let adapterCalls = 0;
    const unsubscribe = subscribeClientApiUpdateRequired((receivedEvent) => {
      event = receivedEvent;
    });
    apiClient.defaults.adapter = (config) => {
      adapterCalls += 1;
      const response: AxiosResponse = {
        data: body,
        status: 426,
        statusText: "Upgrade Required",
        headers: {},
        config,
      };
      return Promise.reject(
        new AxiosError(
          "Request failed with status code 426",
          undefined,
          config,
          undefined,
          response,
        ),
      );
    };

    try {
      await expect(apiGet("/api/protected")).rejects.toMatchObject({
        name: "ClientUpdateRequiredError",
        status: 426,
        body,
      });
      await expect(apiGet("/api/protected")).rejects.toBeInstanceOf(
        ClientUpdateRequiredError,
      );
      expect(event).toEqual({ status: 426, body });
      expect(adapterCalls).toBe(1);
    } finally {
      unsubscribe();
    }
  });
});
