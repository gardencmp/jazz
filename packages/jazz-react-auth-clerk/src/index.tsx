import { BrowserClerkAuth, type MinimalClerkClient } from "jazz-browser-auth-clerk";
import { useState, useMemo } from "react";

export function useJazzClerkAuth(clerk: MinimalClerkClient & {
    signOut: () => Promise<unknown>;
}) {
    const [state, setState] = useState<{ errors: string[] }>({ errors: [] });

    const authMethod = useMemo(() => {
        if (clerk.user) {
            return new BrowserClerkAuth(
                {
                    onError: (error) => {
                        void clerk.signOut();
                        setState((state) => ({
                            ...state,
                            errors: [...state.errors, error.toString()],
                        }));
                    },
                },
                clerk,
            );
        } else {
            return undefined;
        }
    }, [clerk.user]);

    return [authMethod, state] as const;
}
