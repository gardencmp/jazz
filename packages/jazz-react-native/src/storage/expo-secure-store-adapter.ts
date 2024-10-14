import * as SecureStore from "expo-secure-store";
import type { KvStore } from "./kv-store-context.js";

export class ExpoSecureStoreAdapter implements KvStore {
    get(key: string): Promise<string | null> {
        return SecureStore.getItemAsync(key, {
            requireAuthentication: SecureStore.canUseBiometricAuthentication(),
        });
    }

    async set(key: string, value: string): Promise<void> {
        return SecureStore.setItemAsync(key, value, {
            requireAuthentication: SecureStore.canUseBiometricAuthentication(),
        });
    }

    async delete(key: string): Promise<void> {
        return SecureStore.deleteItemAsync(key, {
            requireAuthentication: SecureStore.canUseBiometricAuthentication(),
        });
    }

    async clearAll(): Promise<void> {
        throw new Error("Not implemented");
    }
}
