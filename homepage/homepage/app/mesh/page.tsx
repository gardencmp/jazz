import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { ComingSoonBadge } from "gcmp-design-system/src/app/components/atoms/ComingSoonBadge";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import { H3, H4 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { LI } from "gcmp-design-system/src/app/components/atoms/ListItem";
import { UL } from "gcmp-design-system/src/app/components/molecules/List";
import {
    Prose,
    SmallProse,
} from "gcmp-design-system/src/app/components/molecules/Prose";
import MeshPlusBackup from "./meshPlusBackup.mdx";
import MeshPlusDIY from "./meshPlusDIY.mdx";
import CompletelyDIY from "./completelyDIY.mdx";

import PricingFAQ from "./pricingFaq.mdx";

export const metadata = {
    title: "jazz - Jazz Mesh",
    description: "Serverless sync & storage for Jazz apps.",
};

export default function Mesh() {
    return (
        <>
            <HeroHeader
                title="Sync & Storage Mesh"
                slogan="The first Collaboration Delivery Network."
            />
            <P>
                Real-time sync and storage infrastructure that scales up to
                millions of users.
                <br />
                Pricing that scales down to zero.
            </P>
            <GappedGrid>
                <GridCard>
                    <H3>Optimal mesh routing.</H3>

                    <P>
                        Get ultra-low latency between any group of users with
                        our decentralized mesh interconnect.
                    </P>
                </GridCard>
                <GridCard>
                    <H3>Smart caching.</H3>

                    <P>
                        Give users instant load times, with their latest data
                        state always cached close to them.
                    </P>
                </GridCard>
                <GridCard>
                    <H3>Blob storage & media streaming.</H3>

                    <P>
                        Store files and media streams as idiomatic `CoValues`
                        without S3.
                    </P>
                </GridCard>
            </GappedGrid>
            <SectionHeader title="Pricing" slogan="" />
            <GappedGrid>
                <GridCard>
                    <H3>
                        Mesh Free <div className="text-2xl float-right">$0</div>
                    </H3>

                    <UL>
                        <LI>Best-effort sync</LI>
                        <LI>3,000 sync-minutes/mo</LI>
                        <LI>1 GB storage</LI>
                    </UL>
                </GridCard>
                <GridCard>
                    <H3>
                        Mesh Starter <ComingSoonBadge />
                        <div className="float-right">
                            <span className="text-2xl">$9</span>/mo
                        </div>
                    </H3>
                    <UL>
                        <LI>Base-priority sync</LI>
                        <LI>6,000 sync-minutes/mo</LI>
                        <LI>100 GB storage</LI>
                    </UL>
                    <div className="text-xs">
                        <P>Extra usage:</P>
                        <LI>$9 per additional 6,000 sync-minutes</LI>
                        <LI>$9 per additional 1TB storage/mo</LI>
                    </div>
                </GridCard>
                <GridCard>
                    <H3>
                        Mesh Pro <ComingSoonBadge />
                        <div className="float-right">
                            <span className="text-2xl">$79</span>/mo
                        </div>
                    </H3>
                    <UL>
                        <LI>High-priority sync</LI>
                        <LI>30,000 sync-minutes/mo</LI>
                        <LI>1 TB storage</LI>
                        <LI>Offer sync.yourdomain.com</LI>
                    </UL>
                    <div className="text-xs">
                        <P>Extra usage:</P>
                        <UL>
                            <LI>$15 per additional 6,000 sync-minutes</LI>
                            <LI>$15 per additional 1TB storage/mo</LI>
                        </UL>
                    </div>
                </GridCard>
            </GappedGrid>
            <H3>FAQ:</H3>
            <SmallProse>
                <PricingFAQ />
            </SmallProse>
            <SectionHeader
                title="Global Footprint"
                slogan="We're rapidly expanding our network of sync & storage nodes. This is our current best-effort coverage."
            />
            <GappedGrid>
                <div className="text-sm">
                    <H4>Under 50ms RTT</H4>
                    <UL>
                        <LI>Frankfurt</LI>
                        <LI>New York</LI>
                        <LI>Newark</LI>
                        <LI>North California</LI>
                        <LI>North Virginia</LI>
                        <LI>San Francisco</LI>
                        <LI>Singapore</LI>
                        <LI>Toronto</LI>
                    </UL>
                </div>

                <div className="text-sm">
                    <H4>Under 100ms RTT</H4>
                    <UL>
                        <LI>Amsterdam</LI>
                        <LI>Atlanta</LI>
                        <LI>London</LI>
                        <LI>Ohio</LI>
                        <LI>Paris</LI>
                    </UL>
                </div>

                <div className="text-sm">
                    <H4>Under 200ms RTT</H4>
                    <UL>
                        <LI>Bangalore</LI>
                        <LI>Dallas</LI>
                        <LI>Mumbai</LI>
                        <LI>Oregon</LI>
                    </UL>

                    <H4>Under 300ms RTT</H4>
                    <UL>
                        <LI> Seoul</LI>
                        <LI> Tokyo</LI>
                    </UL>
                </div>

                <div className="text-sm">
                    <H4>Under 400ms RTT</H4>
                    <UL>
                        <LI>Sao Paulo</LI>
                        <LI>Sydney</LI>
                    </UL>

                    <H4>Under 500ms RTT</H4>

                    <UL>
                        <LI>Cape Town</LI>
                    </UL>
                </div>
            </GappedGrid>
            <H3>Enterprise</H3>
            <P>
                Custom deployment in the cloud, your private cloud, on-premises
                or hybrids?
                <br />
                SLAs and dedicated support? White-glove integration services?
                Let&apos;s talk:{" "}
                <a href="mailto:hello@gcmp.io">hello@gcmp.io</a>
            </P>
            <SectionHeader
                title="Custom Deployment Scenarios"
                slogan="You can rely on Jazz Mesh. But you don't have to."
            />
            <P>
                Because Jazz is open-source, you can optionally run your own
                sync nodes &mdash; in a variety of setups.
            </P>
            <GappedGrid>
                <GridCard>
                    <Prose>
                        <MeshPlusBackup />
                    </Prose>
                </GridCard>
                <GridCard>
                    <Prose>
                        <MeshPlusDIY />
                    </Prose>
                </GridCard>
                <GridCard>
                    <Prose>
                        <CompletelyDIY />
                    </Prose>
                </GridCard>
            </GappedGrid>
        </>
    );
}
