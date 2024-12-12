import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { type PasskeyAuthState } from './PasskeyAuth.svelte';
import PasskeyAuthBasicUI from './PasskeyAuthBasicUI.svelte';

describe('PasskeyAuthBasicUI', () => {
  it('should show loading state', () => {
    render(PasskeyAuthBasicUI, {
      props: {
        state: { state: 'loading' } as PasskeyAuthState
      }
    });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show ready state with login and signup options', () => {
    render(PasskeyAuthBasicUI, {
      props: {
        state: { 
          state: 'ready',
          logIn: vi.fn(),
          signUp: vi.fn(),
          errors: []
        }
      }
    });
    
    expect(screen.getByText('Log in with existing account')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Display name')).toBeInTheDocument();
    expect(screen.getByText('Sign up')).toBeInTheDocument();
  });

  it('should display errors when present', () => {
    const error = 'Test error message';
    render(PasskeyAuthBasicUI, {
      props: {
        state: {
          state: 'ready',
          logIn: vi.fn(),
          signUp: vi.fn(),
          errors: [error]
        }
      }
    });
    
    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('should call logIn when login button is clicked', async () => {
    const logIn = vi.fn();
    render(PasskeyAuthBasicUI, {
      props: {
        state: {
          state: 'ready',
          logIn,
          signUp: vi.fn(),
          errors: []
        }
      }
    });
    
    await fireEvent.click(screen.getByText('Log in with existing account'));
    expect(logIn).toHaveBeenCalled();
  });

  it('should call signUp with name when form is submitted', async () => {
    const signUp = vi.fn();
    render(PasskeyAuthBasicUI, {
      props: {
        state: {
          state: 'ready',
          logIn: vi.fn(),
          signUp,
          errors: []
        }
      }
    });
    
    const input = screen.getByPlaceholderText('Display name');
    await fireEvent.input(input, { target: { value: 'Test User' } });
    await fireEvent.submit(screen.getByText('Sign up'));
    
    expect(signUp).toHaveBeenCalledWith('Test User');
  });

  it('should not call signUp when name is empty', async () => {
    const signUp = vi.fn();
    render(PasskeyAuthBasicUI, {
      props: {
        state: {
          state: 'ready',
          logIn: vi.fn(),
          signUp,
          errors: []
        }
      }
    });
    
    await fireEvent.submit(screen.getByText('Sign up'));
    expect(signUp).not.toHaveBeenCalled();
  });
});