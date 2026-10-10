import { MutationCache, MutationObserver, QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  authQueryKeys,
  logoutMutationOptions,
} from "../../src/react-app/features/auth/api/useAuth";
import { ApiError } from "../../src/react-app/lib/api";
import type { User } from "@shared/schemas";

vi.mock("../../src/react-app/lib/api", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("../../src/react-app/lib/api")
  >();
  return {
    ...actual,
    apiPost: vi.fn(),
  };
});

import { apiPost } from "../../src/react-app/lib/api";

const sampleUser = {
  id: "user-1",
  email: "a@example.com",
  displayName: "A",
  bio: null,
  avatarKey: null,
  role: "USER",
  createdAt: "2026-01-01T00:00:00.000Z",
} satisfies User;

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: () => {},
    }),
    defaultOptions: {
      mutations: { throwOnError: false },
    },
  });
}

async function runLogoutMutation(
  queryClient: QueryClient,
  apiImpl: () => Promise<{ ok: true }>,
): Promise<void> {
  vi.mocked(apiPost).mockImplementation(apiImpl);
  const options = logoutMutationOptions(queryClient);

  const observer = new MutationObserver(queryClient, {
    mutationFn: options.mutationFn,
    onSettled: (...args) => {
      options.onSettled?.(...args);
    },
  });
  observer.subscribe(() => {});
  try {
    await observer.mutate(undefined);
  } catch {
    // 401 / 500 など API 失敗は onSettled 後に reject されうる
  }
}

describe("logoutMutationOptions wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["success", () => Promise.resolve({ ok: true as const })],
    ["401", () => Promise.reject(new ApiError(401, { error: "unauthorized" }))],
    ["500", () => Promise.reject(new ApiError(500, { error: "internal" }))],
  ])("sets me to null on %s", async (_label, impl) => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authQueryKeys.me, sampleUser);

    await runLogoutMutation(queryClient, impl as () => Promise<{ ok: true }>);

    expect(queryClient.getQueryData(authQueryKeys.me)).toBeNull();
  });

  it("does not clear me when onSettled from options is not wired", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(authQueryKeys.me, sampleUser);
    vi.mocked(apiPost).mockResolvedValue({ ok: true });

    const options = logoutMutationOptions(queryClient);
    const observer = new MutationObserver(queryClient, {
      mutationFn: options.mutationFn,
    });
    observer.subscribe(() => {});
    await observer.mutate(undefined);

    expect(queryClient.getQueryData(authQueryKeys.me)).toEqual(sampleUser);
  });
});
