import { LocalAuthComponent } from "jazz-react-auth-local";
import { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

export const PrettyAuthComponent: LocalAuthComponent = ({
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
                        <Input
                            placeholder="Display name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoComplete="webauthn"
                            className="text-base"
                        />
                        <Button asChild>
                            <Input
                                type="submit"
                                value="Sign Up as new account"
                            />
                        </Button>
                    </form>
                    <Button onClick={logIn}>
                        Log In with existing account
                    </Button>
                </div>
            )}
        </div>
    );
};
