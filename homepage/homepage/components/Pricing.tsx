import {
    CircleCheckIcon,
    LucideBuilding2,
    LucideCheck,
    LucideCloudDownload,
    LucideCrown,
    LucideDatabase,
    LucideDatabaseZap,
    LucideHammer,
    LucideHandshake,
    LucideIcon,
    LucideMessageCircle,
    LucideMicroscope,
    LucidePhone,
    LucideSearch,
    LucideTicketCheck,
    LucideUsers,
    LucideZap,
} from "lucide-react";
import { Button } from "@/components/Button";
import { FakeGetStartedButton } from "./FakeGetStartedButton";
import { clsx } from "clsx";

export function ListItem({
    variant = "blue",
    icon: Icon = CircleCheckIcon,
    className = "",
    children,
}: {
    variant?: "gray" | "blue";
    icon: LucideIcon;
    className?: string;
    children: React.ReactNode;
}) {
    const iconSize = 16;

    const iconVariants = {
        gray: <Icon size={iconSize} className="text-stone-500 shrink-0" />,
        blue: (
            <Icon
                size={iconSize}
                className="text-blue-500 dark:text-white shrink-0"
            />
        ),
    };

    return (
        <li
            className={clsx(
                "inline-flex items-center gap-2 text-stone-800 dark:text-stone-200 py-2",
                className,
            )}
        >
            {iconVariants[variant]}
            <span>{children}</span>
        </li>
    );
}

export function Pricing() {
    return (
        <div className="flex flex-col sm:max-w-lg mx-auto md:max-w-none md:flex-row md:items-start gap-4">
            <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925">
                <h3 className="flex justify-between items-center font-semibold text-stone-900 text-xl dark:text-white">
                    <div className="flex items-center gap-1">
                        <svg
                            height="24"
                            viewBox="0 0 572 915"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect width="572" height="915" fill="white" />
                            <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M323.76 374.99V604.118L323.76 609.218C323.76 612.374 323.76 613.952 323.733 615.287C322.3 687.368 264.211 745.457 192.13 746.89C190.795 746.917 189.217 746.917 186.061 746.917C165.551 746.917 145.502 741.433 128.448 731.159C111.395 720.886 98.1038 706.283 90.255 689.198C82.4063 672.113 80.3527 653.313 84.3539 635.176C88.3552 617.039 98.2316 600.379 112.734 587.303C127.237 574.226 145.714 565.321 165.83 561.714C185.946 558.106 206.796 559.957 225.745 567.034C234.073 570.145 241.87 574.203 248.96 579.081V168.523H323.539L323.825 168.088C335.078 196.126 351.639 217.913 373.775 232.481C412.506 257.968 464.782 259.038 526.401 239.056L437.345 374.385C394.515 384.815 356.243 385.345 323.76 374.99Z"
                                fill="#3313F7"
                            />
                        </svg>
                        Starter
                    </div>
                    <div className="text-stone-900 dark:text-white">
                        <span className="text-2xl font-light tabular-nums tracking-tighter">
                            $0
                        </span>
                        <span className="text-sm font-normal text-stone-600 dark:text-stone-500">
                            /mo
                        </span>
                    </div>
                </h3>

                <p className="text-sm">
                    For experiments and brand new projects. Start for free with
                    no fuss. Go impress those first users!
                </p>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Limits (lifted during public alpha)
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideUsers} variant="gray">
                            <s className="text-stone-500">
                                max. 100 monthly active users
                            </s>
                        </ListItem>
                        <ListItem icon={LucideDatabase} variant="gray">
                            <s className="text-stone-500">max. 10 GB storage</s>
                        </ListItem>
                        <ListItem icon={LucideCloudDownload} variant="gray">
                            <s className="text-stone-500">
                                max. 2 GB egress/mo
                            </s>
                        </ListItem>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Cloud features
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideCheck}>Best-effort sync</ListItem>
                        <ListItem icon={LucideDatabase}>
                            Best-effort cloud storage
                        </ListItem>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Support
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideMessageCircle}>
                            Community support
                        </ListItem>
                    </ul>
                </div>

                <FakeGetStartedButton />

                <p className="text-sm">No credit card required.</p>
            </div>
            <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925">
                <div>
                    <h3 className="flex justify-between items-center font-semibold text-stone-900 text-xl dark:text-white">
                        <div className="flex items-center gap-1">
                            <svg
                                height="24"
                                viewBox="0 0 739 915"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <rect width="739" height="915" fill="white" />
                                <path
                                    fill-rule="evenodd"
                                    clip-rule="evenodd"
                                    d="M595.034 309.75C530.503 333.096 463.03 345.48 393.587 345.48C363.873 345.48 334.52 343.213 305.604 338.789L305.604 656.769V661.869C305.604 665.026 305.604 666.605 305.578 667.94C304.144 740.02 246.055 798.109 173.975 799.543C172.64 799.569 171.061 799.569 167.904 799.569C147.394 799.569 127.345 794.085 110.292 783.811C93.2381 773.538 79.9466 758.935 72.0978 741.85C64.249 724.765 62.1954 705.966 66.1967 687.828C70.198 669.691 80.0745 653.031 94.5772 639.955C109.08 626.879 127.557 617.974 147.673 614.366C167.789 610.758 188.64 612.61 207.588 619.687C215.917 622.797 223.714 626.856 230.805 631.734V221.176H231.398V167.507C283.579 184.743 337.86 193.839 393.588 193.839C491.089 193.839 584.158 165.996 669.304 115.432V212.883H669.834V530.782H669.835V554.581C669.835 557.738 669.835 559.317 669.808 560.652C668.375 632.732 610.285 690.821 538.205 692.255C536.87 692.281 535.292 692.281 532.135 692.281C511.625 692.281 491.575 686.798 474.522 676.524C457.469 666.25 444.177 651.647 436.328 634.562C428.479 617.478 426.426 598.678 430.427 580.541C434.428 562.404 444.305 545.744 458.808 532.667C473.31 519.591 491.788 510.686 511.904 507.079C532.02 503.471 552.87 505.322 571.819 512.399C580.147 515.51 587.943 519.568 595.034 524.445V309.75Z"
                                    fill="#3313F7"
                                />
                            </svg>
                            Indie
                        </div>
                        <div className="text-stone-900 dark:text-white">
                            <span className="text-2xl font-light tabular-nums tracking-tighter">
                                $19
                            </span>
                            <span className="text-sm font-normal text-stone-600 dark:text-stone-500">
                                /mo
                            </span>
                        </div>
                    </h3>
                </div>

                <p className="text-sm">
                    Growing? Self-serve our proven real-time infra at
                    predictable costs and keep focusing on your app.
                </p>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Limits & extra usage
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideUsers}>
                            max. 10,000 monthly active users
                        </ListItem>
                        <ListItem icon={LucideDatabase}>
                            incl. 500 GB storage{" "}
                            <span className="text-sm text-stone-900 dark:text-white">
                                (then $0.02 per GB)
                            </span>
                        </ListItem>
                        <ListItem icon={LucideCloudDownload}>
                            incl. 100 GB egress/mo{" "}
                            <span className="text-sm text-stone-900 dark:text-white">
                                (then $0.1 per GB)
                            </span>
                        </ListItem>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Cloud features
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideZap}>Priority sync</ListItem>
                        <ListItem icon={LucideDatabaseZap}>
                            SSD cloud storage & daily backups
                        </ListItem>
                        <ListItem icon={LucideSearch}>
                            Basic user analytics
                        </ListItem>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Support
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideMessageCircle}>
                            Community support
                        </ListItem>
                        <ListItem icon={LucideTicketCheck}>
                            Prioritised feature requests
                        </ListItem>
                    </ul>
                </div>

                <Button
                    href="https://cal.com/anselm-io/mesh-pro-intro"
                    size="lg"
                    variant="secondary"
                    disabled
                >
                    Coming Soon
                </Button>

                <p className="text-sm">
                    We&apos;ve designed this tier to be affordable but also
                    self-sustaining, so you can rely on it long-term.
                </p>
            </div>
            <div className="md:flex-1 flex flex-col gap-3 overflow-hidden rounded-xl p-6 shadow-lg shadow-gray-900/5 bg-white dark:bg-stone-925 pb-6">
                <h3 className="flex justify-between items-center font-semibold text-stone-900 text-xl dark:text-white">
                    <div className="flex items-center gap-1">
                        <svg
                            height="24"
                            viewBox="0 0 915 915"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect width="915" height="915" fill="white" />
                            <path
                                fill-rule="evenodd"
                                clip-rule="evenodd"
                                d="M787.801 263.514C709.62 285.205 628.31 299.374 544.7 305.192L544.7 697.499V721.299C544.7 724.456 544.7 726.034 544.674 727.369C543.24 799.45 485.151 857.539 413.07 858.972C411.735 858.999 410.157 858.999 407 858.999C386.49 858.999 366.441 853.515 349.387 843.241C332.334 832.967 319.043 818.365 311.194 801.28C303.345 784.195 301.291 765.395 305.293 747.258C309.294 729.121 319.17 712.461 333.673 699.384C348.176 686.308 366.653 677.403 386.769 673.796C406.885 670.188 427.736 672.039 446.684 679.116C455.013 682.227 462.809 686.285 469.9 691.163V308.142C465.938 308.18 461.971 308.199 458 308.199C402.672 308.199 348.196 304.548 294.8 297.474L294.8 495.2V519C294.8 519.617 294.8 520.174 294.8 520.681V522.399H294.798C294.795 523.516 294.789 524.331 294.774 525.07C293.34 597.151 235.251 655.24 163.171 656.674C161.836 656.7 160.257 656.7 157.1 656.7C136.591 656.7 116.541 651.216 99.4878 640.943C82.4344 630.669 69.1429 616.066 61.2941 598.981C53.4453 581.896 51.3917 563.096 55.393 544.959C59.3943 526.822 69.2708 510.162 83.7735 497.086C98.2762 484.009 116.754 475.104 136.87 471.497C156.985 467.889 177.836 469.741 196.785 476.817C205.113 479.928 212.909 483.986 220 488.864V285.206C220 285.206 220 285.206 220 285.206V130.226C296.571 147.461 376.224 156.558 458.001 156.558C601.078 156.558 737.652 128.713 862.599 78.1484V175.599H862.601V493.499H862.601V517.299C862.601 520.456 862.601 522.034 862.575 523.369C861.141 595.45 803.052 653.539 730.971 654.973C729.636 654.999 728.058 654.999 724.901 654.999C704.391 654.999 684.342 649.515 667.288 639.242C650.235 628.968 636.944 614.365 629.095 597.28C621.246 580.195 619.192 561.395 623.194 543.258C627.195 525.121 637.071 508.461 651.574 495.385C666.077 482.308 684.554 473.403 704.67 469.796C724.786 466.188 745.637 468.04 764.585 475.116C772.914 478.227 780.71 482.285 787.801 487.163V263.514Z"
                                fill="#3313F7"
                            />
                        </svg>
                        Pro
                    </div>
                    <div className="text-stone-900 dark:text-white">
                        <span className="text-lg font-normal">from</span>{" "}
                        <span className="text-2xl font-light tabular-nums tracking-tighter">
                            $199
                        </span>
                        <span className="text-sm font-normal text-stone-600 dark:text-stone-500">
                            /mo
                        </span>
                    </div>
                </h3>

                <p className="text-sm">
                    Wildly successful, just raised or big enterprise? Get our
                    best infra and move quickly with our help.
                </p>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Limits
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideUsers}>
                            Custom monthly active users
                        </ListItem>
                        <ListItem icon={LucideDatabase}>
                            Custom storage
                        </ListItem>
                        <ListItem icon={LucideCloudDownload}>
                            Custom egress
                        </ListItem>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Cloud features
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideCrown}>
                            Highest-priority sync
                        </ListItem>
                        <ListItem icon={LucideDatabaseZap}>
                            SSD cloud storage & custom backups
                        </ListItem>
                        <ListItem icon={LucideMicroscope}>
                            Advanced user analytics
                        </ListItem>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Support
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucidePhone}>
                            Dedicated support
                        </ListItem>
                        <ListItem icon={LucideHammer}>
                            Custom feature development
                        </ListItem>
                        <ListItem icon={LucideHandshake}>
                            Rapid integration & premium onboarding
                        </ListItem>
                    </ul>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-stone-900 dark:text-white">
                        Enterprise needs
                    </h4>
                    <ul className="flex flex-col divide-y text-sm lg:text-base dark:divide-stone-900">
                        <ListItem icon={LucideBuilding2}>SLAs, on-prem & certifications</ListItem>
                    </ul>
                </div>

                <Button
                    href="https://cal.com/anselm-io/mesh-pro-intro"
                    size="lg"
                >
                    Book intro call
                </Button>

                <p className="text-sm">
                    Our team of devs & product experts will get you going for
                    free. Then we&apos;ll make a deal just for you.
                </p>
            </div>
        </div>
    );
}
