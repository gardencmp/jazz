import { BrowserClerkAuth, type MinimalClerkClient } from "jazz-browser-auth-clerk";
import { useState, useMemo } from "react";

export function useJazzClerkAuth(clerk: MinimalClerkClient & {
    signOut: () => Promise<unknown>;
}) {
    const [state, setState] = useState<{ errors: string[] }>({ errors: [] });

    const authMethod = useMemo(() => {
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
    }, [clerk.user]);

    return [authMethod, state] as const;
}
