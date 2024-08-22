import { PackagesSection } from "@/components/layout";
import { Link } from "@/components/ui/link";
import config from "@/config";

export const EnterpriseSection = () => (
  <>
    <PackagesSection
      theme="mesh"
      heading="Enterprise"
      subheading="Say something here."
      link="/mesh"
      linkLabel="Learn more"
      description={
        <>
          <p className="">
            To give you sync and secure collaborative data instantly on a global
            scale, we&rsquo;re running Jazz Mesh. It works with any Jazz-based
            app, requires no setup and has straightforward, scale-to-zero
            pricing.
          </p>
          <p className="">
            Custom deployment in the cloud, your private cloud, on-premises or
            hybrids? SLAs and dedicated support? White-glove integration
            services?
          </p>
          <p className="">
            Let&rsquo;s talk:{" "}
            <Link href={`mailto:${config.EMAIL}`} className="link">
              {config.EMAIL}
            </Link>
          </p>
        </>
      }
    ></PackagesSection>
  </>
);
