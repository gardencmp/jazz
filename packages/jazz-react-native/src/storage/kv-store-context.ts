export interface KvStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  clearAll(): Promise<void>;
}

export class KvStoreContext {
  private static instance: KvStoreContext;
  private storageInstance: KvStore | null = null;

  private constructor() {}

  public static getInstance(): KvStoreContext {
    if (!KvStoreContext.instance) {
      KvStoreContext.instance = new KvStoreContext();
    }
    return KvStoreContext.instance;
  }

  public initialize(store: KvStore): void {
    if (!this.storageInstance) {
      this.storageInstance = store;
    }
  }

  public getStorage(): KvStore {
    if (!this.storageInstance) {
      throw new Error("Storage instance is not initialized.");
    }
    return this.storageInstance;
  }
}

export default KvStoreContext;
