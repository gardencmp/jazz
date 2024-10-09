import { MMKV } from "react-native-mmkv";

const storage = new MMKV({ id: "token-cache" });

export const tokenCache = {
    async getToken(key: string) {
        try {
            const item = storage.getString(key);
            if (item) {
                console.log(`${key} was used 🔐 \n`);
            } else {
                console.log("No values stored under key: " + key);
            }
            return item;
        } catch (error) {
            console.error("SecureStore get item error: ", error);
            storage.delete(key);
            return null;
        }
    },
    async saveToken(key: string, value: string) {
        try {
            storage.set(key, value);
        } catch (err) {
            return;
        }
    },
};
