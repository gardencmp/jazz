import { useCallback, useEffect, useState } from "react";
import { CoID, LocalNode, ContentType } from "cojson";
import { consumeInviteLinkFromWindowLocation } from "jazz-react";

export function useSimpleHashRouterThatAcceptsInvites<C extends ContentType>(
    localNode: LocalNode
) {
    const [currentValueId, setCurrentValueId] = useState<CoID<C>>();

    useEffect(() => {
        const listener = async () => {
            const acceptedInvitation = await consumeInviteLinkFromWindowLocation<C>(localNode);

            if (acceptedInvitation) {
                setCurrentValueId(acceptedInvitation.valueID);
                window.location.hash = acceptedInvitation.valueID;
                return;
            }

            setCurrentValueId(
                (window.location.hash.slice(1) as CoID<C>) || undefined
            );
        };
        window.addEventListener("hashchange", listener);
        listener();

        return () => {
            window.removeEventListener("hashchange", listener);
        };
    }, [localNode]);

    const navigateToValue = useCallback((id: CoID<C> | undefined) => {
        window.location.hash = id || "";
    }, []);

    return [currentValueId, navigateToValue] as const;
}
