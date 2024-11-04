import { H3 } from "gcmp-design-system/src/app/components/atoms/Headings";
import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";

const randomChars = [
    "SFPOHVKNPDKETOMQLMJKX#QDI=TFFFMRJDSJ",
    "A",
    "#MLZJJA-WJEATZULBR%I=MG#VUWOHX",
    "J",
    "HPLNSST!VOMKBANJTYRCR",
    "A",
    "SL#QN%YWI=QBHP-DBHN=A",
    "Z",
    "HXEHHJQJPXLWBI",
    "Z",
    "DPIXCSLHESD+TIVSPFISKG%LMPM",
    "J",
    "HYCSL#QN%IYPMPLQUKUJ",
    "A",
    "YTKAMZKIOD#YR",
    "Z",
    "SFPOHVKNPDKETOM",
    "Z",
    "VBXWFFIX+WVFRNM+CGT",
    "J",
    "HYCSL#QN%IYPMPLQUKUJ",
    "A",
    "KBANJTYRQ!OUTYAO",
    "Z",
];

function Illustration() {
    return (
        <div
            aria-hidden
            className="z-0 order-1 text-sm relative overflow-hidden flex items-center justify-center"
        >
            <div className="z-0 opacity-60 w-full h-full absolute top-0 -right-5 font-mono break-all text-stone-300 tracking-[0.5em] dark:text-stone-800">
                {randomChars.map((char, index) =>
                    index % 2 === 0 ? (
                        <span key={index}>{char}</span>
                    ) : (
                        <span
                            key={index}
                            className="text-stone-600 dark:text-stone-700"
                        >
                            {char}
                        </span>
                    ),
                )}
            </div>

            <svg
                className="size-20 z-30"
                xmlns="http://www.w3.org/2000/svg"
                width="54"
                height="70"
                viewBox="0 0 54 70"
                fill="none"
            >
                <g filter="url(#filter0_d_15_13)">
                    <path
                        d="M40.3334 26V18.8667C40.405 15.2532 39.0423 11.7584 36.5435 9.14716C34.0447 6.53591 30.6133 5.02079 27.0001 4.93335C23.3869 5.02079 19.9555 6.53591 17.4567 9.14716C14.9579 11.7584 13.5952 15.2532 13.6667 18.8667V26H8.66675V54.3334C8.66675 55.2174 9.01794 56.0653 9.64306 56.6904C10.2682 57.3155 11.116 57.6667 12.0001 57.6667H42.0001C42.8841 57.6667 43.732 57.3155 44.3571 56.6904C44.9822 56.0653 45.3334 55.2174 45.3334 54.3334V26H40.3334ZM28.6667 43.05V47.6667H25.3334V42.9C24.522 42.4825 23.8777 41.8001 23.5075 40.966C23.1373 40.132 23.0634 39.1964 23.298 38.3146C23.5327 37.4327 24.0619 36.6576 24.7977 36.1179C25.5335 35.5782 26.4317 35.3063 27.3433 35.3473C28.2549 35.3883 29.1251 35.7398 29.8095 36.3434C30.4938 36.9471 30.9512 37.7666 31.1057 38.6659C31.2603 39.5653 31.1026 40.4904 30.659 41.2879C30.2154 42.0853 29.5124 42.7071 28.6667 43.05ZM37.0001 26H17.0001V18.8667C16.9282 16.1371 17.9397 13.49 19.8134 11.5038C21.6872 9.51763 24.2709 8.35382 27.0001 8.26668C29.7292 8.35382 32.313 9.51763 34.1867 11.5038C36.0605 13.49 37.0719 16.1371 37.0001 18.8667V26Z"
                        fill="#3313F7"
                    />
                </g>
                <defs>
                    <filter
                        id="filter0_d_15_13"
                        x="0.566748"
                        y="0.833349"
                        width="52.8667"
                        height="68.9334"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                        />
                        <feOffset dy="4" />
                        <feGaussianBlur stdDeviation="4.05" />
                        <feComposite in2="hardAlpha" operator="out" />
                        <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 0.454422 0 0 0 0 0.365348 0 0 0 0 1 0 0 0 0.4 0"
                        />
                        <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_15_13"
                        />
                        <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_15_13"
                            result="shape"
                        />
                    </filter>
                </defs>
            </svg>

            <div className="w-20 h-full bg-gradient-to-r from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
            <div className="h-20 w-full bg-gradient-to-b from-stone-50 to-transparent absolute top-0 left-0 z-10 dark:from-stone-925"></div>
            <div className="h-20 w-full bg-gradient-to-t from-stone-50 to-transparent absolute bottom-0 left-0 z-10 dark:from-stone-925"></div>
            <div className="w-20 h-full bg-gradient-to-l from-stone-50 to-transparent absolute top-0 right-0 z-10 dark:from-stone-925"></div>
        </div>
    );
}

export function EncryptionSection() {
    return (
        <div className="border rounded-xl bg-stone-50 shadow-sm overflow-hidden dark:bg-stone-925">
            <div className="flex grid md:grid-cols-3 gap-2 md:gap-3">
                <div className="md:col-span-2 p-4 md:p-8">
                    <H3 className="mb-0 text-balance">
                        End-to-end encrypted and tamper-proof
                    </H3>

                    <Prose className="max-w-2xl mt-2 md:mt-4">
                        <p>
                            <strong>
                                The syncing server never sees your data in
                                plaintext.
                            </strong>{" "}
                            Instead of trusting centralised authorisation, Jazz
                            uses public-key cryptography. Your edits are
                            encrypted and signed on-device, verifiable by
                            everyone and readable only to those given access.
                        </p>
                    </Prose>
                </div>

                <Illustration />
            </div>
        </div>
    );
}
