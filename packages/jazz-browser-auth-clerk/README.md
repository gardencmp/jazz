# `jazz-browser-auth-clerk`

This package provides a [Clerk-based](https://clerk.com/) authentication strategy for Jazz.

## Usage

`useJazzClerkAuth` is a hook that returns a `JazzAuth` object and a `JazzAuthState` object. Provide a Clerk instance to `useJazzClerkAuth`, and it will return the appropriate `JazzAuth` object. Once authenticated, authentication will persist across page reloads, even if the device is offline.


From [the example chat app](https://github.com/gardencmp/jazz/tree/main/examples/chat-clerk):

```typescript
import { ClerkProvider, SignInButton, useClerk } from "@clerk/clerk-react";
import { useJazzClerkAuth } from "jazz-react-auth-clerk";

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  const [auth, state] = useJazzClerkAuth(clerk);

  return (
    <>
      {state.errors.map((error) => (
        <div key={error}>{error}</div>
      ))}
      {auth ? (
        <Jazz.Provider
          auth={auth}
          peer="wss://cloud.jazz.tools/?key=chat-example-jazz-clerk@gcmp.io"
        >
          {children}
        </Jazz.Provider>
      ) : (
        <SignInButton />
      )}
    </>
  );
}
```
