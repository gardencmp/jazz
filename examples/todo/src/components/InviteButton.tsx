import { useState } from "react";

import QRCode from "qrcode";

import { useToast, Button } from "../basicComponents";
import { createInviteLink } from "jazz-react";
import { CoValue } from "jazz-tools";

export function InviteButton<T extends CoValue>({
    value,
    valueHint,
}: {
    value?: T;
    valueHint?: string;
}) {
    const [existingInviteLink, setExistingInviteLink] = useState<string>();
    const { toast } = useToast();

    return (
        value?._owner?.myRole() === "admin" && (
            <Button
                size="sm"
                className="py-0"
                disabled={!value._owner || !value.id}
                variant="outline"
                onClick={async () => {
                    let inviteLink = existingInviteLink;
                    if (value._owner && value.id && !inviteLink) {
                        inviteLink = createInviteLink(value, "writer", {
                            valueHint,
                        });
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
                            }),
                        );
                    }
                }}
            >
                Invite
            </Button>
        )
    );
}
