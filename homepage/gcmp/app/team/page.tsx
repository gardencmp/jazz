import { H1, H2 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { MailIcon } from "lucide-react";
import Link from "next/link";
import { SiGithub, SiTwitter } from "@icons-pack/react-simple-icons";

export default function TeamPage() {
    return (
        <div className="container py-8 lg:py-16">
            <H1>Team</H1>

            <div className="grid gap-1">
                <H2>Anselm Eickhoff (Founder)</H2>
                <Link
                    href="mailto:anselm@gcmp.io"
                    className="flex gap-1 items-center"
                    aria-label="Email address"
                >
                    <MailIcon height="1em" /> anselm@gcmp.io
                </Link>
                <Link
                    href="https://x.com/anselm_io"
                    className="flex gap-1 items-center"
                    aria-label="Twitter link"
                >
                    <SiTwitter height="1em" /> anselm_io
                </Link>
                <Link
                    href="https://github.com/aeplay"
                    className="flex gap-1 items-center"
                    aria-label="GitHub link"
                >
                    <SiGithub height="1em" /> aeplay
                </Link>
            </div>
        </div>
    );
}
