import { QueryClient, type MutationFunctionContext } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  authQueryKeys,
  loginMutationOptions,
} from "../../src/react-app/features/auth/api/useAuth";
import type { User } from "@shared/schemas";

const userA = {
  id: "user-a",
  email: "a@example.com",
  displayName: "A",
  bio: null,
  avatarKey: null,
  role: "USER",
  createdAt: "2026-01-01T00:00:00.000Z",
} satisfies User;

const userB = {
  ...userA,
  id: "user-b",
  email: "b@example.com",
  displayName: "B",
} satisfies User;

function mutationContext(
  queryClient: QueryClient,
): MutationFunctionContext {
  return { client: queryClient, meta: undefined };
}

describe("loginMutationOptions wiring", () => {
  it("clears non-me queries when user changes via onSuccess", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, userA);
    queryClient.setQueryData(["groups"], [{ id: "g1" }]);

    const { onSuccess } = loginMutationOptions(queryClient);
    expect(onSuccess).toBeDefined();
    await onSuccess!(
      { user: userB },
      { email: "", password: "" },
      undefined,
      mutationContext(queryClient),
    );

    expect(queryClient.getQueryData(authQueryKeys.me)).toEqual(userB);
    expect(queryClient.getQueryData(["groups"])).toBeUndefined();
  });

  it("keeps other queries when same user logs in again", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, userA);
    queryClient.setQueryData(["groups"], [{ id: "g1" }]);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { onSuccess } = loginMutationOptions(queryClient);
    await onSuccess!(
      { user: userA },
      { email: "", password: "" },
      undefined,
      mutationContext(queryClient),
    );

    expect(queryClient.getQueryData(["groups"])).toEqual([{ id: "g1" }]);
    expect(invalidateSpy).toHaveBeenCalled();
  });
});
