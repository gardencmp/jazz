import { AgentSecret } from "cojson";
import { Account, ID } from "jazz-tools";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserClerkAuth, MinimalClerkClient } from "../index.js";

describe("BrowserClerkAuth", () => {
    let mockLocalStorage: { [key: string]: string };
    let mockClerkClient: MinimalClerkClient;
    let mockDriver: BrowserClerkAuth.Driver;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {};
        global.localStorage = {
            getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
            setItem: vi.fn((key: string, value: string) => {
                mockLocalStorage[key] = value;
            }),
            removeItem: vi.fn((key: string) => {
                delete mockLocalStorage[key];
            }),
            clear: vi.fn(),
            length: 0,
            key: vi.fn(),
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

    describe("clerk credentials in localStorage", () => {
        it("should get credentials from localStorage when clerk user is not signed in", async () => {
            mockLocalStorage["jazz-clerk-auth"] = JSON.stringify({
                accountID: "test-account-id",
                accountSecret: "test-secret",
            });

            const auth = new BrowserClerkAuth(mockDriver, {
                ...mockClerkClient,
                user: null,
            });

            const result = await auth.start();
            expect(result.type).toBe("existing");
        });
    });

    describe("clerk credentials not in localStorage", () => {
        it("should return new credentials when clerk user signs up", async () => {
            const auth = new BrowserClerkAuth(mockDriver, mockClerkClient);
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

            const auth = new BrowserClerkAuth(mockDriver, mockClerkClient);
            const result = await auth.start();
            expect(result.type).toBe("existing");
        });

        it("should throw error when not signed in", async () => {
            const auth = new BrowserClerkAuth(mockDriver, {
                ...mockClerkClient,
                user: null,
            });

            await expect(auth.start()).rejects.toThrow("Not signed in");
        });

        it("should save credentials to localStorage", async () => {
            const auth = new BrowserClerkAuth(mockDriver, mockClerkClient);
            const result = await auth.start();
            result.saveCredentials?.({
                accountID: "test-account-id" as ID<Account>,
                secret: "test-secret" as AgentSecret,
            });

            expect(mockLocalStorage["jazz-clerk-auth"]).toBeDefined();
        });

        it("should call clerk signOut when logging out", async () => {
            const auth = new BrowserClerkAuth(mockDriver, mockClerkClient);
            const result = await auth.start();
            result.logOut();

            expect(mockClerkClient.signOut).toHaveBeenCalled();
        });
    });
});
