import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  authQueryKeys,
  clearUserScopedQueries,
  handleSessionExpired,
} from "../../src/react-app/features/auth";
import { ApiError } from "../../src/react-app/lib/api";
import type { User } from "@shared/schemas";

const sampleUser = {
  id: "user-1",
  email: "a@example.com",
  displayName: "A",
  bio: null,
  avatarKey: null,
  role: "USER",
  createdAt: "2026-01-01T00:00:00.000Z",
} satisfies User;

describe("clearUserScopedQueries", () => {
  it("removes queries other than me and keeps me", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, sampleUser);
    queryClient.setQueryData(["groups"], [{ id: "g1", name: "G" }]);
    queryClient.setQueryData(["users", "other"], { id: "other" });

    clearUserScopedQueries(queryClient);

    expect(queryClient.getQueryData(authQueryKeys.me)).toEqual(sampleUser);
    expect(queryClient.getQueryData(["groups"])).toBeUndefined();
    expect(queryClient.getQueryData(["users", "other"])).toBeUndefined();
  });

  it("notifies me observers when setQueryData(me, null)", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, sampleUser);

    const observer = new QueryObserver(queryClient, {
      queryKey: authQueryKeys.me,
      queryFn: async () => sampleUser,
    });
    const listener = vi.fn();
    observer.subscribe(listener);

    queryClient.setQueryData(authQueryKeys.me, null);

    expect(observer.getCurrentResult().data).toBeNull();
    observer.destroy();
  });
});

describe("handleSessionExpired", () => {
  it("sets me to null on 401 unauthorized", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, sampleUser);

    handleSessionExpired(
      queryClient,
      new ApiError(401, { error: "unauthorized" }),
    );

    expect(queryClient.getQueryData(authQueryKeys.me)).toBeNull();
  });

  it("ignores invalid_credentials and non-ApiError", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, sampleUser);

    handleSessionExpired(
      queryClient,
      new ApiError(401, { error: "invalid_credentials" }),
    );
    expect(queryClient.getQueryData(authQueryKeys.me)).toEqual(sampleUser);

    handleSessionExpired(queryClient, new Error("network"));
    expect(queryClient.getQueryData(authQueryKeys.me)).toEqual(sampleUser);
  });

  it("does nothing when me is already null", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, null);

    handleSessionExpired(
      queryClient,
      new ApiError(401, { error: "unauthorized" }),
    );

    expect(queryClient.getQueryData(authQueryKeys.me)).toBeNull();
  });
});
