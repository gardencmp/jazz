import ReactGuide from "./react.mdx";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import { clsx } from "clsx";

export default function Page() {
    return (
        <div
            className={clsx(
                "col-span-12 md:col-span-8 lg:col-span-9",
                "flex justify-center lg:gap-5",
            )}
        >
            <Prose className="overflow-x-hidden lg:flex-1">
                <ReactGuide />
            </Prose>
        </div>
    );
}
