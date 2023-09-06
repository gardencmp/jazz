import { useState } from "react";

import { TodoProject } from "../1_types";

import { createInviteLink } from "jazz-react";
import QRCode from "qrcode";

import { useToast, Button } from "../basicComponents";

export function InviteButton({ list }: { list?: TodoProject }) {
    const [existingInviteLink, setExistingInviteLink] = useState<string>();
    const { toast } = useToast();

    return (
        list?.group.myRole() === "admin" && (
            <Button
                size="sm"
                className="py-0"
                disabled={!list}
                variant="outline"
                onClick={async () => {
                    let inviteLink = existingInviteLink;
                    if (list && !inviteLink) {
                        inviteLink = createInviteLink(list, "writer");
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
