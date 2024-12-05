import { createJazzApp } from 'jazz-svelte';
import { FileShareAccount } from './schema';

export const { useAccount, useCoState, useAcceptInvite, useAccountOrGuest, Provider } =
  createJazzApp({
    AccountSchema: FileShareAccount
  });
