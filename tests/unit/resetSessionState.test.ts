import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { resetSessionState } from "../../src/react-app/app/session/resetSessionState";
import { authQueryKeys } from "../../src/react-app/features/auth";
import {
  SELECTED_GROUP_STORAGE_KEY,
  useSelectedGroupStore,
} from "../../src/react-app/features/groups";
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

describe("resetSessionState", () => {
  it("clears non-me queries, selected group store, and storage", () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(authQueryKeys.me, sampleUser);
    queryClient.setQueryData(["groups"], [{ id: "g1" }]);

    useSelectedGroupStore.setState({ selectedGroupId: "prev-group" });
    const storage = {
      data: new Map<string, string>([[SELECTED_GROUP_STORAGE_KEY, "prev-group"]]),
      getItem(key: string) {
        return this.data.get(key) ?? null;
      },
      setItem(key: string, value: string) {
        this.data.set(key, value);
      },
      removeItem(key: string) {
        this.data.delete(key);
      },
    };

    resetSessionState(queryClient, storage);

    expect(queryClient.getQueryData(authQueryKeys.me)).toEqual(sampleUser);
    expect(queryClient.getQueryData(["groups"])).toBeUndefined();
    expect(useSelectedGroupStore.getState().selectedGroupId).toBeNull();
    expect(storage.getItem(SELECTED_GROUP_STORAGE_KEY)).toBeNull();
  });
});
