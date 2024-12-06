import { AgentSecret } from "cojson";
import type { KvStore } from "jazz-react-native";
import { Account, ID } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MinimalClerkClient, ReactNativeClerkAuth } from "../index.js";

describe("ReactNativeClerkAuth", () => {
  let mockLocalStorage: { [key: string]: string };
  let mockClerkClient: MinimalClerkClient;
  let mockDriver: ReactNativeClerkAuth.Driver;
  let mockKvStore: KvStore;

  beforeEach(() => {
    // Mock in-memory NativeStorage
    mockLocalStorage = {};
    mockKvStore = {
      get: vi.fn(async (key: string) => mockLocalStorage[key] || null),
      set: vi.fn(async (key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      delete: vi.fn(async (key: string) => {
        delete mockLocalStorage[key];
      }),
      clearAll: vi.fn(async () => {
        mockLocalStorage = {};
      }),
    };

    // Mock Clerk client
    mockClerkClient = {
      user: {
        unsafeMetadata: {},
        fullName: "Test User",
        username: "testuser",
        id: "test-id",
        update: vi.fn(),
      },
      signOut: vi.fn(),
    };

    // Mock driver
    mockDriver = {
      onError: vi.fn(),
    };
  });

  describe("clerk credentials in NativeStorage", () => {
    it("should get credentials from NativeStorage when clerk user is not signed in", async () => {
      await mockKvStore.set(
        "jazz-clerk-auth",
        JSON.stringify({
          accountID: "test-account-id",
          accountSecret: "test-secret",
        }),
      );

      const auth = new ReactNativeClerkAuth(
        mockDriver,
        {
          ...mockClerkClient,
          user: null,
        },
        mockKvStore,
      );

      const result = await auth.start();
      expect(result.type).toBe("existing");
    });
  });

  describe("clerk credentials not in NativeStorage", () => {
    it("should return new credentials when clerk user signs up", async () => {
      const auth = new ReactNativeClerkAuth(
        mockDriver,
        mockClerkClient,
        mockKvStore,
      );
      const result = await auth.start();
      expect(result.type).toBe("new");
    });

    it("should return existing credentials when clerk user is signed in", async () => {
      mockClerkClient = {
        user: {
          unsafeMetadata: {
            jazzAccountID: "test-account-id",
            jazzAccountSecret: "test-secret",
          },
          fullName: "Test User",
          username: "testuser",
          id: "test-id",
          update: vi.fn(),
        },
        signOut: vi.fn(),
      };

      const auth = new ReactNativeClerkAuth(
        mockDriver,
        mockClerkClient,
        mockKvStore,
      );
      const result = await auth.start();
      expect(result.type).toBe("existing");
    });

    it("should throw error when not signed in", async () => {
      const auth = new ReactNativeClerkAuth(
        mockDriver,
        {
          ...mockClerkClient,
          user: null,
        },
        mockKvStore,
      );

      await expect(auth.start()).rejects.toThrow("Not signed in");
    });

    it("should save credentials to NativeStorage", async () => {
      const auth = new ReactNativeClerkAuth(
        mockDriver,
        mockClerkClient,
        mockKvStore,
      );
      const result = await auth.start();
      if (result.saveCredentials) {
        await result.saveCredentials({
          accountID: "test-account-id" as ID<Account>,
          secret: "test-secret" as AgentSecret,
        });
      }

      expect(await mockKvStore.get("jazz-clerk-auth")).toBeDefined();
    });

    it("should call clerk signOut when logging out", async () => {
      const auth = new ReactNativeClerkAuth(
        mockDriver,
        mockClerkClient,
        mockKvStore,
      );
      const result = await auth.start();
      result.logOut();

      expect(mockClerkClient.signOut).toHaveBeenCalled();
    });
  });
});
