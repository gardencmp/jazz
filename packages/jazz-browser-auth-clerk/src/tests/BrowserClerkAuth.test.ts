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

    it("should throw error when not signed in", async () => {
        const auth = new BrowserClerkAuth(mockDriver, {
            ...mockClerkClient,
            user: null,
        });

        await expect(auth.start()).rejects.toThrow("Not signed in");
    });

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
