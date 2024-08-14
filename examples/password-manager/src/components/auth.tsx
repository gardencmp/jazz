import { useState } from "react";

import { PasskeyAuth } from "jazz-react";

export const PrettyAuthUI: PasskeyAuth.Component = ({
  loading,
  logIn,
  signUp,
}) => {
  const [username, setUsername] = useState<string>("");

  return (
    <div className="w-full h-full flex items-center justify-center p-5">
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="w-72 flex flex-col gap-4">
          <form
            className="w-72 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              signUp(username);
            }}
          >
            <input
              placeholder="Display name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="webauthn"
              className="text-base"
            />

            <input type="submit" value="Sign Up as new account" />
          </form>
          <button onClick={logIn}>Log In with existing account</button>
        </div>
      )}
    </div>
  );
};
