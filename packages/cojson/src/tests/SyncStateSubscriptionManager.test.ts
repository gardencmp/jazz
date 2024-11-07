import { expect, test, describe, vi, onTestFinished } from "vitest";
import { createTestNode, waitFor } from "./testUtils.js";
import { connectedPeers } from "../streamUtils.js";
import { emptyKnownState } from "../sync.js";

describe("SyncStateSubscriptionManager", () => {
    test("subscribeToUpdates receives updates when peer state changes", async () => {
        // Setup nodes
        const client = createTestNode();
        const jazzCloud = createTestNode();

        // Create test data
        const group = client.createGroup();
        const map = group.createMap();
        map.set("key1", "value1", "trusting");

        // Connect nodes
        const [clientAsPeer, jazzCloudAsPeer] = connectedPeers(
            "clientConnection",
            "jazzCloudConnection",
            {
                peer1role: "client",
                peer2role: "server",
            },
        );

        client.syncManager.addPeer(jazzCloudAsPeer);
        jazzCloud.syncManager.addPeer(clientAsPeer);

        const subscriptionManager =
            client.syncManager.syncStateSubscriptionManager;

        const updateSpy = vi.fn();
        const unsubscribe = subscriptionManager.subscribeToUpdates(updateSpy);

        await client.syncManager.actuallySyncCoValue(map.core);

        expect(updateSpy).toHaveBeenCalledWith(
            "jazzCloudConnection",
            emptyKnownState(map.core.id),
            false,
        );

        await waitFor(() => {
            return subscriptionManager.getIsCoValueFullyUploadedIntoPeer(
                "jazzCloudConnection",
                map.core.id,
            );
        });

        expect(updateSpy).toHaveBeenCalledWith(
            "jazzCloudConnection",
            client.syncManager.peers["jazzCloudConnection"]!.knownStates.get(
                map.core.id,
            )!,
            true,
        );

        // Cleanup
        unsubscribe();
    });

    test("subscribeToPeerUpdates receives updates only for specific peer", async () => {
        // Setup nodes
        const client = createTestNode();
        const jazzCloud = createTestNode();

        // Create test data
        const group = client.createGroup();
        const map = group.createMap();
        map.set("key1", "value1", "trusting");

        // Connect nodes
        const [clientAsPeer, jazzCloudAsPeer] = connectedPeers(
            "clientConnection",
            "jazzCloudConnection",
            {
                peer1role: "client",
                peer2role: "server",
            },
        );

        const [clientStoragePeer] = connectedPeers(
            "clientStorage",
            "unusedPeer",
            {
                peer1role: "client",
                peer2role: "server",
            },
        );

        client.syncManager.addPeer(jazzCloudAsPeer);
        client.syncManager.addPeer(clientStoragePeer);
        jazzCloud.syncManager.addPeer(clientAsPeer);

        const subscriptionManager =
            client.syncManager.syncStateSubscriptionManager;

        const updateToJazzCloudSpy = vi.fn();
        const updateToStorageSpy = vi.fn();
        const unsubscribe1 = subscriptionManager.subscribeToPeerUpdates(
            "jazzCloudConnection",
            updateToJazzCloudSpy,
        );
        const unsubscribe2 = subscriptionManager.subscribeToPeerUpdates(
            "clientStorage",
            updateToStorageSpy,
        );

        onTestFinished(() => {
            unsubscribe1();
            unsubscribe2();
        });

        await client.syncManager.actuallySyncCoValue(map.core);

        expect(updateToJazzCloudSpy).toHaveBeenCalledWith(
            emptyKnownState(map.core.id),
            false,
        );

        await waitFor(() => {
            return subscriptionManager.getIsCoValueFullyUploadedIntoPeer(
                "jazzCloudConnection",
                map.core.id,
            );
        });

        expect(updateToJazzCloudSpy).toHaveBeenLastCalledWith(
            client.syncManager.peers["jazzCloudConnection"]!.knownStates.get(
                map.core.id,
            )!,
            true,
        );

        expect(updateToStorageSpy).toHaveBeenLastCalledWith(
            emptyKnownState(map.core.id),
            false,
        );
    });

    test("getIsCoValueFullyUploadedIntoPeer returns correct status", async () => {
        // Setup nodes
        const client = createTestNode();
        const jazzCloud = createTestNode();

        // Create test data
        const group = client.createGroup();
        const map = group.createMap();
        map.set("key1", "value1", "trusting");

        // Connect nodes
        const [clientAsPeer, jazzCloudAsPeer] = connectedPeers(
            "clientConnection",
            "jazzCloudConnection",
            {
                peer1role: "client",
                peer2role: "server",
            },
        );

        client.syncManager.addPeer(jazzCloudAsPeer);
        jazzCloud.syncManager.addPeer(clientAsPeer);

        await client.syncManager.actuallySyncCoValue(map.core);

        const subscriptionManager =
            client.syncManager.syncStateSubscriptionManager;

        expect(
            subscriptionManager.getIsCoValueFullyUploadedIntoPeer(
                "jazzCloudConnection",
                map.core.id,
            ),
        ).toBe(false);

        await waitFor(() => {
            return subscriptionManager.getIsCoValueFullyUploadedIntoPeer(
                "jazzCloudConnection",
                map.core.id,
            );
        });

        expect(
            subscriptionManager.getIsCoValueFullyUploadedIntoPeer(
                "jazzCloudConnection",
                map.core.id,
            ),
        ).toBe(true);
    });

    test("unsubscribe stops receiving updates", async () => {
        // Setup nodes
        const client = createTestNode();
        const jazzCloud = createTestNode();

        // Create test data
        const group = client.createGroup();
        const map = group.createMap();
        map.set("key1", "value1", "trusting");

        // Connect nodes
        const [clientAsPeer, jazzCloudAsPeer] = connectedPeers(
            "clientConnection",
            "jazzCloudConnection",
            {
                peer1role: "client",
                peer2role: "server",
            },
        );

        client.syncManager.addPeer(jazzCloudAsPeer);
        jazzCloud.syncManager.addPeer(clientAsPeer);

        const subscriptionManager =
            client.syncManager.syncStateSubscriptionManager;
        const anyUpdateSpy = vi.fn();
        const unsubscribe1 =
            subscriptionManager.subscribeToUpdates(anyUpdateSpy);
        const unsubscribe2 = subscriptionManager.subscribeToPeerUpdates(
            "jazzCloudConnection",
            anyUpdateSpy,
        );

        unsubscribe1();
        unsubscribe2();

        await client.syncManager.actuallySyncCoValue(map.core);

        anyUpdateSpy.mockClear();

        await waitFor(() => {
            return client.syncManager.syncStateSubscriptionManager.getIsCoValueFullyUploadedIntoPeer(
                "jazzCloudConnection",
                map.core.id,
            );
        });

        expect(anyUpdateSpy).not.toHaveBeenCalled();
    });
});
