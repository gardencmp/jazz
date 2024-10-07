export interface NativeStorage {
    get(key: string): Promise<string | undefined>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
    clearAll(): Promise<void>;
}

export class NativeStorageContext {
    private static instance: NativeStorageContext;
    private storageInstance: NativeStorage | null = null;

    private constructor() {}

    public static getInstance(): NativeStorageContext {
        if (!NativeStorageContext.instance) {
            NativeStorageContext.instance = new NativeStorageContext();
        }
        return NativeStorageContext.instance;
    }

    public initialize(db: NativeStorage): void {
        if (!this.storageInstance) {
            this.storageInstance = db;
        }
    }

    public getStorage(): NativeStorage {
        if (!this.storageInstance) {
            throw new Error("Storage instance is not initialized.");
        }
        return this.storageInstance;
    }
}

export default NativeStorageContext;
