import { Input } from "./components/ui/input.tsx";
import { Button } from "./components/ui/button.tsx";
import { AuthComponent } from "jazz-react";
import { useLocalAuth } from "jazz-react-auth-local";

export const LocalAuth: AuthComponent = ({ onCredential }) => {
    const { displayName, setDisplayName, signIn, signUp } = useLocalAuth(onCredential);

    return (<div className="w-full h-full flex items-center justify-center">
        <div className="w-72 flex flex-col gap-4">
            <form
                className="w-72 flex flex-col gap-2"
                onSubmit={(e) => {
                    e.preventDefault();
                    signUp();
                }}
            >
                <Input
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="webauthn" />
                <Button asChild>
                    <Input type="submit" value="Sign Up as new account" />
                </Button>
            </form>
            <Button onClick={signIn}>Log In with existing account</Button>
        </div>
    </div>);
};
