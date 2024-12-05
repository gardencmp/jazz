# `jazz-browser-auth-clerk`

This package provides a [Clerk-based](https://clerk.com/) authentication strategy for Jazz.

Looking for a React integration? Check out [`jazz-react-auth-clerk`](https://www.npmjs.com/package/jazz-react-auth-clerk).

## Usage

`BrowserClerkAuth` is a class that provides a `JazzAuth` object. Provide a Clerk instance to `BrowserClerkAuth`, and it will return the appropriate `JazzAuth` object. Once authenticated, authentication will persist across page reloads, even if the device is offline.


From [the example app](https://github.com/garden-co/jazz/tree/main/examples/clerk):

```ts
import { BrowserClerkAuth } from "jazz-browser-auth-clerk";

// ...

const auth = new BrowserClerkAuth(
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
```
