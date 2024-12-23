import { AgentSecret } from "cojson";
import { Account, ID } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RNDemoAuth } from "../auth/DemoAuthMethod";
import { KvStore, KvStoreContext } from "../storage/kv-store-context";

// Initialize mock storage
const mockStorage: { [key: string]: string } = {};

// Mock KvStore implementation
const mockKvStore: KvStore = {
  get: vi.fn(async (key: string) => mockStorage[key] || null),
  set: vi.fn(async (key: string, value: string) => {
    mockStorage[key] = value;
  }),
  delete: vi.fn(async (key: string) => {
    delete mockStorage[key];
  }),
  clearAll: vi.fn(async () => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
};

KvStoreContext.getInstance().initialize(mockKvStore);

beforeEach(() => {
  mockKvStore.clearAll();
  vi.clearAllMocks();
});

function setup() {
  const mockDriver: RNDemoAuth.Driver = {
    onReady: vi.fn(),
    onSignedIn: vi.fn(),
    onError: vi.fn(),
  };

  return {
    mockStorage,
    mockKvStore,
    mockDriver,
  };
}

describe("RNDemoAuth", () => {
  describe("initialization", () => {
    it("should initialize with seed accounts", async () => {
      const { mockKvStore, mockDriver } = setup();

      const seedAccounts = {
        testUser: {
          accountID: "test-account-id" as ID<Account>,
          accountSecret: "test-secret" as AgentSecret,
        },
      };

      await RNDemoAuth.init(mockDriver, seedAccounts);

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-existing-users",
        "testUser",
      );
      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-existing-users-" + btoa("testUser"),
        expect.any(String),
      );
    });
  });

  describe("authentication", () => {
    it("should handle new user signup", async () => {
      const { mockDriver } = setup();

      mockDriver.onReady = vi.fn(({ signUp }) => {
        signUp("testUser");
      });

      const auth = await RNDemoAuth.init(mockDriver);
      const result = await auth.start();

      expect(mockDriver.onReady).toHaveBeenCalled();
      expect(result.type).toBe("new");
      expect(result.saveCredentials).toBeDefined();
    });

    it("should handle existing user login", async () => {
      const { mockStorage, mockDriver } = setup();

      // Set up existing user in storage
      const existingUser = {
        accountID: "test-account-id" as ID<Account>,
        accountSecret: "test-secret" as AgentSecret,
      };

      mockStorage["demo-auth-logged-in-secret"] = JSON.stringify(existingUser);

      const auth = await RNDemoAuth.init(mockDriver);
      const result = await auth.start();

      if (result.type !== "existing") {
        throw new Error("Result is not a existing user");
      }

      expect(result.type).toBe("existing");
      expect(result.credentials).toEqual({
        accountID: existingUser.accountID,
        secret: existingUser.accountSecret,
      });
    });

    it("should handle logout", async () => {
      const { mockKvStore, mockDriver } = setup();

      mockDriver.onReady = vi.fn(({ signUp }) => {
        signUp("testUser");
      });

      const auth = await RNDemoAuth.init(mockDriver);
      const result = await auth.start();

      await result.logOut();
      expect(mockKvStore.delete).toHaveBeenCalledWith(
        "demo-auth-logged-in-secret",
      );
    });
  });

  describe("user management", () => {
    it("should signup a new user", async () => {
      const { mockKvStore, mockDriver } = setup();

      mockDriver.onReady = vi.fn(({ signUp }) => {
        return signUp("testUser");
      });
      const auth = await RNDemoAuth.init(mockDriver);
      const result = await auth.start();

      if (result.type !== "new") {
        throw new Error("Result is not a new user");
      }

      await result.saveCredentials({
        accountID: "test-account-id" as ID<Account>,
        secret: "test-secret" as AgentSecret,
      });

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-existing-users-" + btoa("testUser"),
        expect.any(String),
      );

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-existing-users",
        "testUser",
      );

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-logged-in-secret",
        expect.any(String),
      );
    });

    it("should login an existing user", async () => {
      const { mockStorage, mockKvStore, mockDriver } = setup();

      const credentials = {
        accountID: "test-account-id" as ID<Account>,
        accountSecret: "test-secret" as AgentSecret,
      };

      mockStorage["demo-auth-existing-users-" + btoa("testUser")] =
        JSON.stringify(credentials);

      mockDriver.onReady = vi.fn(({ logInAs }) => {
        return logInAs("testUser");
      });

      const auth = await RNDemoAuth.init(mockDriver);
      const result = await auth.start();

      if (result.type !== "existing") {
        throw new Error("Result is not a existing user");
      }

      expect(result.credentials).toEqual({
        accountID: credentials.accountID,
        secret: credentials.accountSecret,
      });

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-logged-in-secret",
        JSON.stringify(credentials),
      );
    });

    it("should handle duplicate usernames by adding suffix", async () => {
      const { mockStorage, mockKvStore, mockDriver } = setup();

      mockDriver.onReady = vi.fn(({ signUp }) => {
        return signUp("testUser");
      });
      mockStorage["demo-auth-existing-users"] = "testUser";

      const auth = await RNDemoAuth.init(mockDriver);
      const result = await auth.start();

      if (result.type !== "new") {
        throw new Error("Result is not a new user");
      }

      await result.saveCredentials({
        accountID: "test-account-id" as ID<Account>,
        secret: "test-secret" as AgentSecret,
      });

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-existing-users-" + btoa("testUser-2"),
        expect.any(String),
      );

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-existing-users",
        "testUser,testUser-2",
      );
    });

    it("should retrieve existing users", async () => {
      const { mockStorage, mockDriver } = setup();

      mockDriver.onReady = vi.fn(({ signUp }) => {
        return signUp("testUser");
      });

      mockStorage["demo-auth-existing-users"] = "user1,user2,user3";

      const auth = await RNDemoAuth.init(mockDriver);
      const result = await auth.start();

      if (result.type !== "new") {
        throw new Error("Result is not a new user");
      }

      await result.saveCredentials({
        accountID: "test-account-id" as ID<Account>,
        secret: "test-secret" as AgentSecret,
      });

      const onReadyCall = vi.mocked(mockDriver.onReady).mock.calls[0]![0];
      const existingUsers = await onReadyCall.getExistingUsers();

      expect(existingUsers).toEqual(["user1", "user2", "user3", "testUser"]);
    });

    it("should migrate legacy user keys to the new format", async () => {
      const { mockStorage, mockKvStore, mockDriver } = setup();

      const value = JSON.stringify({
        accountID: "test-account-id" as ID<Account>,
        accountSecret: "test-secret" as AgentSecret,
      });

      mockStorage["demo-auth-existing-users"] = "testUser";
      mockStorage["demo-auth-existing-users-testUser"] = value;

      await RNDemoAuth.init(mockDriver);

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-existing-users-" + btoa("testUser"),
        value,
      );

      expect(mockKvStore.set).toHaveBeenCalledWith(
        "demo-auth-storage-version",
        "2",
      );

      expect(mockKvStore.delete).toHaveBeenCalledWith(
        "demo-auth-existing-users-testUser",
      );
    });
  });
});
