class MockExternalSystem {
  expectedToken: string;
  kv: Map<string, any> = new Map();

  constructor(expectedToken: string) {
    this.expectedToken = expectedToken;
  }

  async set(key: string, value: any) {
    console.log(`Setting ${key} to ${value} in external system`);
    this.kv.set(key, value);
  }

  async get(key: string) {
    console.log(`Getting ${key} from external system`);
    return this.kv.get(key);
  }
}
