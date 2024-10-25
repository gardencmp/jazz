import { Nav } from "gcmp-design-system/src/app/components/organisms/Nav";
import { GcmpLogo } from "gcmp-design-system/src/app/components/atoms/logos/GcmpLogo";
import { Button } from "gcmp-design-system/src/app/components/atoms/Button";
export function GcmpNav() {
    const cta = (
        <Button
            variant="secondary"
            className="ml-auto"
            href="mailto:hello@gcmp.io"
        >
            Contact us
        </Button>
    );
    return (
        <Nav
            mainLogo={<GcmpLogo className="h-10 w-auto" />}
            items={[
                { title: "Theses & Products", href: "/" },
                { title: "Blog", href: "/news" },
                { title: "Team", href: "/team" },
            ]}
            cta={cta}
        ></Nav>
    );
}
