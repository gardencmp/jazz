# `jazz-react-auth-clerk`

This package provides a [Clerk-based](https://clerk.com/) authentication strategy for Jazz's React bindings.

## Usage

`useJazzClerkAuth` is a hook that returns a `JazzAuth` object and a `JazzAuthState` object. Provide a Clerk instance to `useJazzClerkAuth`, and it will return the appropriate `JazzAuth` object. Once authenticated, authentication will persist across page reloads, even if the device is offline.


See the full [example app](https://github.com/garden-co/jazz/tree/main/examples/clerk) for a complete example.

```tsx
import { ClerkProvider, SignInButton, useClerk } from "@clerk/clerk-react";
import { useJazzClerkAuth } from "jazz-react-auth-clerk";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const clerk = useClerk();
  const [auth, state] = useJazzClerkAuth(clerk);

  return (
    <>
      {state?.errors?.map((error) => (
        <div key={error}>{error}</div>
      ))}
      {clerk.user && auth ? (
        <Jazz.Provider
          auth={auth}
          peer="wss://cloud.jazz.tools/?key=your-email-address"
        >
          {children}
        </Jazz.Provider>
      ) : (
        <SignInButton />
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <JazzAndAuth>
        <App />
      </JazzAndAuth>
    </ClerkProvider>
  </StrictMode>,
);

```
