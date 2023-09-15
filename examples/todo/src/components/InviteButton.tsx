import { useState } from "react";

import { createInviteLink } from "jazz-react";
import QRCode from "qrcode";

import { useToast, Button } from "../basicComponents";
import { CoValue, Queried } from "cojson";

export function InviteButton<T extends CoValue>({ value }: { value: T | Queried<T> | undefined }) {
    const [existingInviteLink, setExistingInviteLink] = useState<string>();
    const { toast } = useToast();

    return (
        value?.group?.myRole() === "admin" && (
            <Button
                size="sm"
                className="py-0"
                disabled={!value.group || !value.id}
                variant="outline"
                onClick={async () => {
                    let inviteLink = existingInviteLink;
                    if (value.group && value.id && !inviteLink) {
                        inviteLink = createInviteLink(value, "writer");
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
                Invite
            </Button>
        )
    );
}
