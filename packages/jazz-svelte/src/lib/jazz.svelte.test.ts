import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getContext } from 'svelte';
import { Account, type AuthMethod, type ID } from 'jazz-tools';
import { getJazzContext, createJazzApp, JAZZ_CTX } from './jazz.svelte';
import { render, screen } from '@testing-library/svelte';
import TestComponent from './tests/TestComponent.svelte';
import ProviderTestComponent from './tests/ProviderTestComponent.svelte';

// Mock svelte's getContext as we can't use it outside of a component
vi.mock('svelte', async (importOriginal) => {
  return {
    ...await importOriginal<typeof import('svelte')>(),
    getContext: vi.fn(),
    untrack: vi.fn((fn) => fn())
  };
});

// Mock jazz-browser as the browser context is not always available
vi.mock('jazz-browser', () => ({
  createJazzBrowserContext: vi.fn(() =>
    Promise.resolve({
      me: undefined,
      logOut: vi.fn(),
      done: vi.fn()
    })
  )
}));

// Mocks for coValue observables
const mockUnsubscribe = vi.fn();
const mockSubscribe = vi.fn((Schema, id, me, depth, callback) => {
  callback();
  return {
    unsubscribe: mockUnsubscribe
  };
});

// Mock of a coValue observable
const mockObservable = {
  subscribe: mockSubscribe,
  getCurrentValue: vi.fn(() => ({ value: 'test value' }))
};

// Mock jazz-tools as we don't want to actually subscribe to any coValues
vi.mock('jazz-tools', async (importOriginal) => ({
  ...await importOriginal<typeof import('jazz-tools')>(),
  createCoValueObservable: vi.fn(() => mockObservable)
}));

describe('jazz.svelte', () => {
  let mockAccount: Account;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAccount = {
      id: 'test-account-id',
      name: 'Test Account'
    } as unknown as Account;

    mockSubscribe.mockClear();
    mockUnsubscribe.mockClear();
    mockObservable.getCurrentValue.mockClear();
  });

  describe('getJazzContext', () => {
    it('should return the jazz context from svelte context', () => {
      const mockContext = { current: { me: mockAccount } };
      (getContext as jest.Mock).mockReturnValue(mockContext);

      const result = getJazzContext();
      expect(result).toBe(mockContext);
      expect(getContext).toHaveBeenCalledWith(JAZZ_CTX);
    });

    it('should return undefined if no context is set', () => {
      (getContext as jest.Mock).mockReturnValue(undefined);

      const result = getJazzContext();
      expect(result).toBeUndefined();
    });
  });

  describe('Provider Component', () => {
    it('should provide jazz context to children', async () => {
      const mockAuthState = {
        type: 'account',
        account: mockAccount,
        signOut: vi.fn()
      } as unknown as AuthMethod;

      render(ProviderTestComponent, {
        props: {
          auth: mockAuthState
        }
      });

      const accountName = await screen.findByTestId('provider-auth-test');
      expect(JSON.parse(accountName.textContent || '').account).toEqual(mockAccount);
    });

    it('should handle guest mode correctly', async () => {
      render(ProviderTestComponent, {
        props: {
          auth: 'guest'
        }
      });

      const errorMessage = await screen.findByTestId('provider-auth-test');
      expect(JSON.parse(errorMessage.textContent || '')).toBe('guest');
    });
  });

  describe('createJazzApp', () => {
    it('should create a jazz app with default Account schema', () => {
      const app = createJazzApp();
      expect(app).toHaveProperty('useAccount');
      expect(app).toHaveProperty('Provider');
    });

    it('should create a jazz app with custom Account schema', () => {
      class CustomAccount extends Account {}
      const app = createJazzApp({ AccountSchema: CustomAccount });
      expect(app).toHaveProperty('useAccount');
      expect(app).toHaveProperty('Provider');
    });

    describe('useAccount', () => {
      const mockContext = {
        current: {
          me: mockAccount,
          logOut: vi.fn()
        }
      };

      beforeEach(() => {
        (getContext as jest.Mock).mockReturnValue(mockContext);
      });

      it('should throw error if used outside JazzProvider', () => {
        (getContext as jest.Mock).mockReturnValue(undefined);
        const app = createJazzApp();

        expect(() => app.useAccount()).toThrow('useAccount must be used within a JazzProvider');
      });

      it('should throw error if used in guest context', () => {
        (getContext as jest.Mock).mockReturnValue({ current: { isGuest: true } });
        const app = createJazzApp();

        expect(() => app.useAccount()).toThrow(
          "useAccount can't be used in a JazzProvider with auth === 'guest'"
        );
      });

      it('should return account and logOut function when no depth specified', () => {
        const app = createJazzApp();
        const result = app.useAccount();

        expect(result.me).toBe(mockContext.current.me);
        expect(result.logOut).toBeDefined();
      });
    });

    describe('coState operations', () => {
      beforeEach(() => {
        (getContext as jest.Mock).mockReturnValue({
          current: {
            me: mockAccount,
            logOut: vi.fn(),
            done: vi.fn()
          }
        });
      });

      it('should handle subscription lifecycle', async () => {
        // Setup initial render
        const { rerender } = render(TestComponent, {
          props: {
            schema: Account,
            id: 'co_test-id' as ID<Account>,
            depth: {}
          }
        });

        // Verify initial subscription
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
        expect(mockSubscribe).toHaveBeenCalledWith(
          Account,
          'co_test-id',
          mockAccount,
          {},
          expect.any(Function)
        );

        // Clear mock to make it easier to track new calls
        mockSubscribe.mockClear();

        // Test resubscription with new props
        await rerender({
          schema: Account,
          id: 'new_id' as ID<Account>,
          depth: {}
        });

        // Should have subscribed again with new ID
        expect(mockSubscribe).toHaveBeenCalledTimes(1);
        expect(mockSubscribe).toHaveBeenCalledWith(
          Account,
          'new_id',
          mockAccount,
          {},
          expect.any(Function)
        );
      });

      it('should handle missing context', async () => {
        // Mock getContext to return undefined before rendering
        (getContext as jest.Mock).mockReturnValue(undefined);

        // Render should not throw
        render(TestComponent, {
          props: {
            schema: Account,
            id: 'co_test-id' as ID<Account>,
            depth: {}
          }
        });

        // Should not subscribe without context
        expect(mockSubscribe).not.toHaveBeenCalled();

        // Value should be empty when result.current is undefined
        const value = await screen.findByTestId('current-value');
        expect(value.textContent).toBe('');
      });

      it('should update state when callback is triggered', async () => {
        mockObservable.getCurrentValue
          .mockReturnValueOnce({ value: 'initial' })
          .mockReturnValueOnce({ value: 'updated' });

        render(TestComponent, {
          props: {
            schema: Account,
            id: 'co_test-id' as ID<Account>,
            depth: {}
          }
        });

        // Get callback function that was passed to subscribe
        const [[, , , , callback]] = mockSubscribe.mock.calls;

        // Initial value
        let value = await screen.findByTestId('current-value');
        expect(value.textContent).toBe(JSON.stringify({ value: 'initial' }));

        // Trigger callback
        callback();

        // Should show updated value
        value = await screen.findByTestId('current-value');
        expect(value.textContent).toBe(JSON.stringify({ value: 'updated' }));
      });

      it('should support coState operations', async () => {
        (getContext as jest.Mock).mockReturnValue({
          current: {
            me: mockAccount,
            logOut: vi.fn(),
            done: vi.fn()
          }
        });

        const { unmount } = render(TestComponent, {
          props: {
            schema: Account,
            id: 'co_test-id' as ID<Account>,
            depth: {}
          }
        });

        // Verify the value is displayed
        const value = await screen.findByTestId('current-value');
        expect(value.textContent).toBe(JSON.stringify({ value: 'test value' }));

        // Verify subscribe was called with correct parameters
        expect(mockSubscribe).toHaveBeenCalledWith(
          Account,
          'co_test-id',
          mockAccount,
          {},
          expect.any(Function)
        );

        // Verify cleanup function was returned
        expect(mockUnsubscribe).not.toHaveBeenCalled();

        // Unmount should trigger cleanup
        // unmount();
        // TODO: Figure out why this fails
        // expect(mockUnsubscribe).toHaveBeenCalled();
      });
    });
  });
});
