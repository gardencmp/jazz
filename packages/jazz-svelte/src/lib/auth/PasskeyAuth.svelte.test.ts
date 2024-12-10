import { BrowserPasskeyAuth } from 'jazz-browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePasskeyAuth } from './PasskeyAuth.svelte';

// Mock jazz-browser
vi.mock('jazz-browser', () => ({
  BrowserPasskeyAuth: vi.fn()
}));

// Mock Svelte's onMount
vi.mock('svelte', () => ({
  onMount: vi.fn((cb) => cb())
}));

describe('usePasskeyAuth', () => {
  let mockBrowserPasskeyAuth: any;
  const appName = 'Test App';

  beforeEach(() => {
    vi.clearAllMocks();
    mockBrowserPasskeyAuth = {
      onReady: vi.fn(),
      onSignedIn: vi.fn(),
      onError: vi.fn()
    };
    (BrowserPasskeyAuth as jest.Mock).mockImplementation(
      (callbacks: any) => {
        mockBrowserPasskeyAuth.callbacks = callbacks;
        return mockBrowserPasskeyAuth;
      }
    );
  });

  it('should initialize with loading state', () => {
    const auth = usePasskeyAuth({ appName });
    expect(auth.state).toEqual({
      state: 'loading',
      errors: []
    });
  });

  it('should transition to ready state when onReady is called', () => {
    const auth = usePasskeyAuth({ appName });
    const mockNext = {
      logIn: vi.fn(),
      signUp: vi.fn()
    };

    mockBrowserPasskeyAuth.callbacks.onReady(mockNext);

    expect(auth.state).toEqual({
      state: 'ready',
      logIn: mockNext.logIn,
      signUp: mockNext.signUp,
      errors: []
    });
  });

  it('should transition to signedIn state when onSignedIn is called', () => {
    const auth = usePasskeyAuth({ appName });
    const mockNext = {
      logOut: vi.fn()
    };

    mockBrowserPasskeyAuth.callbacks.onSignedIn(mockNext);

    expect(auth.state).toEqual({
      state: 'signedIn',
      logOut: expect.any(Function),
      errors: []
    });
  });

  it('should handle logout process', () => {
    const auth = usePasskeyAuth({ appName });
    const mockNext = {
      logOut: vi.fn()
    };

    mockBrowserPasskeyAuth.callbacks.onSignedIn(mockNext);
    (auth.state as any).logOut();

    expect(mockNext.logOut).toHaveBeenCalled();
    expect(auth.state).toEqual({
      state: 'loading',
      errors: []
    });
  });

  it('should accumulate errors when onError is called', () => {
    const auth = usePasskeyAuth({ appName });
    const error1 = new Error('Test error 1');
    const error2 = new Error('Test error 2');

    mockBrowserPasskeyAuth.callbacks.onError(error1);
    mockBrowserPasskeyAuth.callbacks.onError(error2);

    expect(auth.state.errors).toEqual([
      error1.toString(),
      error2.toString()
    ]);
  });

  it('should initialize with custom hostname', () => {
    const hostname = 'test.example.com';
    usePasskeyAuth({ appName, appHostname: hostname });

    expect(BrowserPasskeyAuth).toHaveBeenCalledWith(
      expect.any(Object),
      appName,
      hostname
    );
  });

  it('should expose current instance', () => {
    const auth = usePasskeyAuth({ appName });
    expect(auth.current).toEqual(mockBrowserPasskeyAuth);
  });
}); 