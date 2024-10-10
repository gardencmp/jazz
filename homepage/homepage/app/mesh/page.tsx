import { HeroHeader } from "gcmp-design-system/src/app/components/molecules/HeroHeader";
import { SectionHeader } from "gcmp-design-system/src/app/components/molecules/SectionHeader";
import { GappedGrid } from "gcmp-design-system/src/app/components/molecules/GappedGrid";
import { GridCard } from "gcmp-design-system/src/app/components/atoms/GridCard";
import { ComingSoonBadge } from "gcmp-design-system/src/app/components/atoms/ComingSoonBadge";
import { P } from "gcmp-design-system/src/app/components/atoms/Paragraph";
import {
    H2,
    H3,
    H4,
} from "gcmp-design-system/src/app/components/atoms/Headings";
import { LI } from "gcmp-design-system/src/app/components/atoms/ListItem";
import { UL } from "gcmp-design-system/src/app/components/molecules/List";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import MeshPlusBackup from "./meshPlusBackup.mdx";
import MeshPlusDIY from "./meshPlusDIY.mdx";
import CompletelyDIY from "./completelyDIY.mdx";
import { Button } from "@/components/Button";
import { Pricing } from "@/components/Pricing";

export const metadata = {
    title: "jazz - Jazz Mesh",
    description: "Serverless sync & storage for Jazz apps.",
};

export default function Mesh() {
    return (
        <div className="space-y-16">
            <HeroHeader
                className="container"
                title="Jazz Mesh"
                slogan="Real-time sync and storage infrastructure that scales up to millions of users."
            />
            <div className="container">
                <P>Pricing that scales down to zero.</P>
                <GappedGrid>
                    <GridCard>
                        <H3>Optimal mesh routing.</H3>

                        <P>
                            Get ultra-low latency between any group of users
                            with our decentralized mesh interconnect.
                        </P>
                    </GridCard>
                    <GridCard>
                        <H3>Smart caching.</H3>

                        <P>
                            Give users instant load times, with their latest
                            data state always cached close to them.
                        </P>
                    </GridCard>
                    <GridCard>
                        <H3>Blob storage & media streaming.</H3>

                        <P>
                            Store files and media streams as idiomatic
                            `CoValues` without S3.
                        </P>
                    </GridCard>
                </GappedGrid>
            </div>

            <div className="bg-stone-100 border-y dark:bg-stone-925 py-8 lg:py-16 dark:border-y-0 dark:bg-transparent dark:py-0">
                <div className="container">
                    <H2 className="mb-5 sm:text-center md:text-left">
                        Pricing
                    </H2>

                    <Pricing />
                </div>
            </div>

            <div className="container space-y-16">
                <div>
                    <SectionHeader title="Pricing" slogan="" />
                    <GappedGrid>
                        <GridCard>
                            <H3>
                                Mesh Free{" "}
                                <div className="text-2xl float-right">$0</div>
                            </H3>

                            <UL>
                                <LI>Best-effort sync</LI>
                                <LI>Community support</LI>
                                <LI>
                                    <s>20 Monthly Active Users</s>
                                </LI>
                                <LI>
                                    <s>1 GB storage</s>
                                </LI>
                            </UL>
                            <div className="border-white bg-blue-50 border-4 rounded-lg px-4 -rotate-6 shadow">
                                <p className="text-center my-4 font-bold">
                                    Public Alpha
                                </p>
                                <UL>
                                    <LI>Use your email address as API key</LI>
                                    <LI>Currently no enforced limits</LI>
                                </UL>
                            </div>
                        </GridCard>
                        <GridCard>
                            <H3>
                                Mesh Indie <ComingSoonBadge />
                                <div className="float-right">
                                    <span className="text-2xl">$19</span>/mo
                                </div>
                            </H3>
                            <UL>
                                <LI>Base-priority sync</LI>
                                <LI>Community support</LI>
                                <LI>1000 Monthly Active Usersincluded</LI>
                                <LI>500 GB storageincluded</LI>
                            </UL>
                            <P>Extra usage:</P>
                            <LI>$9 per add. 1000 Monthly Active Users</LI>
                            <LI>$9 per add. 500 GB storage/mo</LI>

                            <p className="mt-4 text-sm">
                                For companies with &lt;$200k in annual revenue
                                or institutional funding.
                            </p>
                        </GridCard>
                        <GridCard>
                            <H3>
                                Mesh Pro
                                <div className="float-right">
                                    from <span className="text-2xl">$500</span>
                                    /mo
                                </div>
                            </H3>
                            <UL>
                                <LI>Highest-priority sync</LI>
                                <LI>Dedicated integration & dev support</LI>
                                <LI>Unlimited Monthly Active Users</LI>
                                <LI>Unlimited storage</LI>
                                <LI>SLAs, custom deployment, etc.</LI>
                                <LI>
                                    Offer <code>sync.yourdomain.com</code>
                                </LI>
                            </UL>
                            <Button
                                href="https://cal.com/anselm-io/mesh-pro-intro"
                                size="lg"
                                className="block text-center"
                            >
                                Book intro call
                            </Button>
                            <p className="mt-4 text-sm">
                                Our team of devs & product experts will
                                get you going for free. Then we&apos;ll make a
                                 deal just for you.
                            </p>
                        </GridCard>
                    </GappedGrid>
                </div>

                <div>
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


                </div>

                <div>
                    <SectionHeader
                        title="Custom Deployment Scenarios"
                        slogan="You can rely on Jazz Mesh. But you don't have to."
                    />
                    <P>
                        Because Jazz is open-source, you can optionally run your
                        own sync nodes &mdash; in a variety of setups.
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
                </div>
            </div>
        </div>
    );
}
