import { useState } from "react";

import { MapSpace } from "../1_types";

import { createInviteLink } from "jazz-react";
import QRCode from "qrcode";

import { useToast, Button } from "../basicComponents";
import { Queried } from "cojson";

export function ShareButton({ mapSpace }: { mapSpace?: Queried<MapSpace> }) {
    const [existingInviteLink, setExistingInviteLink] = useState<string>();
    const { toast } = useToast();

    return (
        mapSpace?.group.myRole() === "admin" && (
            <Button
                size="sm"
                className="py-0"
                disabled={!mapSpace}
                variant="outline"
                onClick={async () => {
                    let inviteLink = existingInviteLink;
                    if (mapSpace && !inviteLink) {
                        inviteLink = createInviteLink(mapSpace, "writer");
                        setExistingInviteLink(inviteLink);
                    }
                    if (inviteLink) {
                        const qr = await QRCode.toDataURL(inviteLink, {
                            errorCorrectionLevel: "L",
                        });
                        navigator.clipboard.writeText(inviteLink).then(() =>
                            toast({
                                title: "Copied invite link to clipboard!",
                                description: (
                                    <img src={qr} className="w-20 h-20" />
                                ),
                            })
                        );
                    }
                }}
            >
                Share
            </Button>
        )
    );
}
