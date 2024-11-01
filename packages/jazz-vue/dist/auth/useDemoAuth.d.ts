import { AgentSecret } from 'cojson';
import { BrowserDemoAuth } from 'jazz-browser';
import { Account, ID } from 'jazz-tools';
export type DemoAuthState = ({
    state: "uninitialized";
} | {
    state: "loading";
} | {
    state: "ready";
    existingUsers: string[];
    signUp: (username: string) => void;
    logInAs: (existingUser: string) => void;
} | {
    state: "signedIn";
    logOut: () => void;
}) & {
    errors: string[];
};
/** @category Auth Providers */
export declare function useDemoAuth({ seedAccounts, }?: {
    seedAccounts?: {
        [name: string]: {
            accountID: ID<Account>;
            accountSecret: AgentSecret;
        };
    };
}): {
    authMethod: import('vue').Ref<{
        driver: {
            onReady: (next: {
                signUp: (username: string) => Promise<void>;
                existingUsers: string[];
                logInAs: (existingUser: string) => Promise<void>;
            }) => void;
            onSignedIn: (next: {
                logOut: () => void;
            }) => void;
            onError: (error: string | Error) => void;
        };
        start: () => Promise<import('jazz-tools').AuthResult>;
    }, BrowserDemoAuth | {
        driver: {
            onReady: (next: {
                signUp: (username: string) => Promise<void>;
                existingUsers: string[];
                logInAs: (existingUser: string) => Promise<void>;
            }) => void;
            onSignedIn: (next: {
                logOut: () => void;
            }) => void;
            onError: (error: string | Error) => void;
        };
        start: () => Promise<import('jazz-tools').AuthResult>;
    }>;
    state: import('vue').Reactive<DemoAuthState>;
};
