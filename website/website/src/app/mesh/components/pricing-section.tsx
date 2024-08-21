import clsx from "clsx";
import { ThemeIcon, Theme, getThemeTextClass } from "@/components/theme";
import { Card, CardMetaHeading } from "@/components/card";
import { CustomMDX } from "@/components/mdx";
import { Link } from "@/components/ui/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowUpRightIcon } from "lucide-react";

export const PricingSection = () => (
  <div className="grid grid-cols-3 outline outline-[1em] outline-transparent rounded-lg">
    {/* <div className="grid grid-cols-12 gap-w4">
      <div className="col-span-full ml-[-0.2em]">
        <header className="flex">
          <h1 className="Text-subtitle text-fill-contrast !leading-[1.1]">
            Pricing
          </h1>
        </header>
      </div>
    </div> */}
    <>
      {pricing.map((item, index) => (
        <div
          key={index}
          className={clsx(
            "bg-canvas",
            "px-w4 pb-w4",
            "overflow-hidden [&_.prose]:pt-w3",
            "border border-fill",
            "first:rounded-l-lg first:border-r-0",
            "last:rounded-r-lg last:border-l-0",
          )}
        >
          <h3
            className={clsx(
              "Text-heading text-fill-contrast !leading-[1]",
              "flex items-center justify-between",
              "-mx-w4 px-4 py-w3 border-b",
            )}
          >
            {item.heading}
            <span className="X">
              ${item.price}
              {item.price === 0 ? (
                ""
              ) : (
                <span className="text-fine text-solid tracking-[0.02em]">
                  /mo
                </span>
              )}
            </span>
          </h3>
          {/* <CardMetaHeading theme="covalues">{item.heading}</CardMetaHeading> */}
          <div className="prose text-fill-contrast">
            <CustomMDX source={item.description} />
          </div>
          {item.extra && (
            <div className="prose prose-sm text-fill">
              <CustomMDX source={item.extra} />
            </div>
          )}
        </div>
      ))}
    </>
  </div>
);

const pricing = [
  {
    heading: "Free",
    price: 0,
    description: `
- Best-effort sync
- 3,000 sync-minutes/mo
- 1 GB storage
  `,
  },
  {
    heading: "Starter",
    price: 9,
    description: `
- Base-priority sync
- 6,000 sync-minutes/mo
- 100 GB storage
  `,
    extra: `
Extra usage:

- $9 per additional 6,000 sync-minutes
- $9 per additional 1TB storage/mo
    `,
  },
  {
    heading: "Pro",
    price: 79,
    description: `
- High-priority sync
- 30,000 sync-minutes/mo
- 1 TB storage
- Offer sync.yourdomain.com
  `,
    extra: `
Extra usage:

- $15 per additional 6,000 sync-minutes
- $15 per additional 1TB storage/mo
    `,
  },
];
