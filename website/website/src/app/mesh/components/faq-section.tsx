import { CustomMDX } from "@/components/mdx";
import clsx from "clsx";

export const FaqSection = () => (
  <div className="grid grid-cols-3">
    {faq.map((item, index) => (
      // pl-w3?
      <div key={index} className={clsx("[&_.prose]:pt-w3 pl-1 lg:pr-w8")}>
        <h4 className={clsx("text-small font-semibold text-fill-contrast")}>
          {item.heading}
        </h4>
        <div className="prose prose-sm text-fill">
          <CustomMDX source={item.description} />
        </div>
      </div>
    ))}
  </div>
);

const faq = [
  {
    heading: "How are sync-minutes counted?",
    description: `Sync-minutes are counted on a per-connected-device, per-minute basis. A device is considered syncing only when it's actively sending or receiving data.`,
  },
  {
    heading: "How can I estimate my usage?",
    description: `The best way to estimate your usage is to guess how many minutes per month each user will spend actively using your app. Storage is mostly determined by large binary blobs (like images or videos) that you store in Jazz.`,
  },
  {
    heading: "What happens if I exceed my plan's limits?",
    description: `
All limits are initially soft limits, so don't worry if you suddenly get lots of users or traffic!

Sync beyond the limit is still served, but at a lower priority. Data beyond the storage limit is still stored and backed up, but may be significantly slower to access. If you exceed your plan's limits consistently, we'll reach out to discuss upgrading your plan.
    `,
  },
];
