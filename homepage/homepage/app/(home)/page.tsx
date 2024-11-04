import { Testimonial } from "gcmp-design-system/src/app/components/molecules/Testimonial";
import { SupportedEnvironmentsSection } from "@/components/home/SupportedEnvironmentsSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowJazzWorksSection } from "@/components/home/HowJazzWorksSection";
import ProblemStatementSection from "@/components/home/ProblemStatementSection";
import { LocalFirstFeaturesSection } from "@/components/home/LocalFirstFeaturesSection";
import { CollaborationFeaturesSection } from "@/components/home/CollaborationFeaturesSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { EncryptionSection } from "@/components/home/EncryptionSection";
import { ComingSoonSection } from "@/components/home/ComingSoonSection";
import { EarlyAdopterSection } from "@/components/home/EarlyAdopterSection";
import { CodeExampleSection } from "@/components/home/CodeExampleSection";

export default function Home() {
    return (
        <>
            <HeroSection />

            <ProblemStatementSection />

            <div className="container flex flex-col gap-12 mt-12 lg:gap-20 lg:mt-20">
                <HowJazzWorksSection />

                <Testimonial name="Serious Adopter #4" role="Technical Founder">
                    <p>
                        You don&apos;t have to think about deploying a database,
                        SQL schemas, relations, and writing queries… Basically,{" "}
                        <span className="bg-blue-50 px-1 dark:bg-transparent">
                            if you know TypeScript, you know Jazz
                        </span>
                        , and you can ship an app. It&apos;s just so nice!
                    </p>
                </Testimonial>

                <LocalFirstFeaturesSection />

                <CollaborationFeaturesSection />

                <Testimonial name="Serious Adopter #1" role="Lead Developer">
                    We just wanted to build a single-player experience first,
                    planning to add team and org features much later. But
                    because of Jazz, we had that from day one.{" "}
                    <span className="bg-blue-50 px-1 dark:bg-transparent">
                        All we needed to add was an invite button.
                    </span>
                </Testimonial>

                <EncryptionSection />

                <FeaturesSection />

                <CodeExampleSection />

                <SupportedEnvironmentsSection />

                <ComingSoonSection />

                <EarlyAdopterSection />
            </div>
        </>
    );
}
