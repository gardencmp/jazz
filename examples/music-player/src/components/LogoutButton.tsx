import { Button } from "./ui/button";
import { useAccount } from "@/2_main";

export function LogoutButton() {
    const { logOut } = useAccount();

    return (
        <Button onClick={logOut}>
            Logout
        </Button>
    );
}
