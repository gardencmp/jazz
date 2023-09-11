import { AccountID } from "cojson";
import { useProfile } from "jazz-react";

import { Skeleton } from "@/basicComponents";
import uniqolor from "uniqolor";

/** Walkthrough: Getting user profiles in `<NameBadge/>`
 *
 *  `<NameBadge/>` uses `useProfile(accountID)`, which is a shorthand for
 *  useTelepathicState on an account's profile.
 *
 *  Profiles are always a `CoMap<{name: string}>`, but they might have app-specific
 *  additional properties).
 *
 *  In our case, we just display the profile name (which is set by the LocalAuth
 *  provider when we first create an account).
 */

export function NameBadge({ accountID }: { accountID?: AccountID }) {
    const profile = useProfile(accountID);

    return accountID && profile?.get("name") ? (
        <span
            className="rounded-full py-0.5 px-2 text-xs"
            style={randomUserColor(accountID)}
        >
            {profile.get("name")}
        </span>
    ) : (
        <Skeleton className="mt-1 w-[50px] h-[1em] rounded-full" />
    );
}

function randomUserColor(accountID: AccountID) {
    const theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

    const brightColor = uniqolor(accountID || "", { lightness: 80 }).color;
    const darkColor = uniqolor(accountID || "", { lightness: 20 }).color;

    return {
        color: theme == "light" ? darkColor : brightColor,
        background: theme == "light" ? brightColor : darkColor,
    };
}
