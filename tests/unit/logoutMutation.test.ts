import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  authQueryKeys,
  onLogoutMutationSettled,
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

describe("logout mutation settled", () => {
  it.each([
    ["success", () => Promise.resolve({ ok: true })],
    ["401", () => Promise.reject(new ApiError(401, { error: "unauthorized" }))],
    ["500", () => Promise.reject(new ApiError(500, { error: "internal" }))],
  ])("sets me to null on %s", async (_label, impl) => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, sampleUser);
    vi.mocked(apiPost).mockImplementation(impl as () => Promise<{ ok: true }>);

    await new Promise<void>((resolve) => {
      const observer = new MutationObserver(queryClient, {
        mutationFn: async () => {
          try {
            return await apiPost("/api/auth/logout", {} as never);
          } catch {
            return null;
          }
        },
        onSettled: () => {
          onLogoutMutationSettled(queryClient);
          resolve();
        },
      });
      observer.subscribe(() => {});
      observer.mutate(undefined);
    });

    expect(queryClient.getQueryData(authQueryKeys.me)).toBeNull();
  });
});
