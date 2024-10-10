import { MMKV } from "react-native-mmkv";
import type { NativeStorage } from "jazz-react-native";

const storage = new MMKV();

export class MMKVStorage implements NativeStorage {
    get(key: string): Promise<string | undefined> {
        return Promise.resolve(storage.getString(key));
    }

    set(key: string, value: string): Promise<void> {
        storage.set(key, value);
        return Promise.resolve();
    }

    delete(key: string): Promise<void> {
        storage.delete(key);
        return Promise.resolve();
    }

    clearAll(): Promise<void> {
        storage.clearAll();
        return Promise.resolve();
    }
}
