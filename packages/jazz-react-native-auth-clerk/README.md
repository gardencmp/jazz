# `jazz-react-native-auth-clerk`

This package provides a [Clerk-based](https://clerk.com/) authentication strategy for Jazz.

Looking for a React integration? Check out [`jazz-react-auth-clerk`](https://www.npmjs.com/package/jazz-react-native-auth-clerk).

## Usage

`ReactNativeClerkAuth` is a class that provides a `JazzAuth` object. Provide a Clerk instance to `ReactNativeClerkAuth`, and it will return the appropriate `JazzAuth` object. Once authenticated, authentication will persist across page reloads, even if the device is offline.


From [the example app](https://github.com/gardencmp/jazz/tree/main/examples/chat-rn-clerk):

```ts
import { ReactNativeClerkAuth } from "jazz-react-native-auth-clerk";

// ...

const auth = new ReactNativeClerkAuth(
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
