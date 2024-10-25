import { clsx } from "clsx";

export function JazzLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 386 146"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={clsx(className, "text-black dark:text-white")}
        >
            <path
                d="M176.725 33.865H188.275V22.7H176.725V33.865ZM164.9 129.4H172.875C182.72 129.4 188.275 123.9 188.275 114.22V43.6H176.725V109.545C176.725 115.65 173.975 118.51 167.925 118.51H164.9V129.4ZM245.298 53.28C241.613 45.47 233.363 41.95 222.748 41.95C208.998 41.95 200.748 48.44 197.888 58.615L208.613 61.915C210.648 55.315 216.368 52.565 222.638 52.565C231.933 52.565 235.673 56.415 236.058 64.61C226.433 65.93 216.643 67.195 209.768 69.23C200.583 72.145 195.743 77.865 195.743 86.83C195.743 96.51 202.673 104.65 215.818 104.65C225.443 104.65 232.318 101.35 237.213 94.365V103H247.388V66.425C247.388 61.475 247.168 57.185 245.298 53.28ZM217.853 95.245C210.483 95.245 207.128 91.34 207.128 86.72C207.128 82.045 210.593 79.515 215.323 77.92C220.328 76.435 226.983 75.5 235.948 74.18C235.893 76.93 235.673 80.725 234.738 83.475C233.418 89.25 227.643 95.245 217.853 95.245ZM251.22 103H301.545V92.715H269.535L303.195 45.47V43.6H254.3V53.885H284.935L251.22 101.185V103ZM304.815 103H355.14V92.715H323.13L356.79 45.47V43.6H307.895V53.885H338.53L304.815 101.185V103Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M136.179 44.8277C136.179 44.8277 136.179 44.8277 136.179 44.8276V21.168C117.931 28.5527 97.9854 32.6192 77.0897 32.6192C65.1466 32.6192 53.5138 31.2908 42.331 28.7737V51.4076C42.331 51.4076 42.331 51.4076 42.331 51.4076V81.1508C41.2955 80.4385 40.1568 79.8458 38.9405 79.3915C36.1732 78.358 33.128 78.0876 30.1902 78.6145C27.2524 79.1414 24.5539 80.4419 22.4358 82.3516C20.3178 84.2613 18.8754 86.6944 18.291 89.3433C17.7066 91.9921 18.0066 94.7377 19.1528 97.2329C20.2991 99.728 22.2403 101.861 24.7308 103.361C27.2214 104.862 30.1495 105.662 33.1448 105.662H33.1455C33.6061 105.662 33.8365 105.662 34.0314 105.659C44.5583 105.449 53.042 96.9656 53.2513 86.4386C53.2534 86.3306 53.2544 86.2116 53.2548 86.0486H53.2552V85.7149L53.2552 85.5521V82.0762L53.2552 53.1993C61.0533 54.2324 69.0092 54.7656 77.0897 54.7656C77.6696 54.7656 78.2489 54.7629 78.8276 54.7574V110.696C77.792 109.983 76.6533 109.391 75.437 108.936C72.6697 107.903 69.6246 107.632 66.6867 108.159C63.7489 108.686 61.0504 109.987 58.9323 111.896C56.8143 113.806 55.3719 116.239 54.7875 118.888C54.2032 121.537 54.5031 124.283 55.6494 126.778C56.7956 129.273 58.7368 131.405 61.2273 132.906C63.7179 134.406 66.646 135.207 69.6414 135.207C70.1024 135.207 70.3329 135.207 70.5279 135.203C81.0548 134.994 89.5385 126.51 89.7478 115.983C89.7517 115.788 89.7517 115.558 89.7517 115.097V111.621L89.7517 54.3266C101.962 53.4768 113.837 51.4075 125.255 48.2397V80.9017C124.219 80.1894 123.081 79.5966 121.864 79.1424C119.097 78.1089 116.052 77.8384 113.114 78.3653C110.176 78.8922 107.478 80.1927 105.36 82.1025C103.242 84.0122 101.799 86.4453 101.215 89.0941C100.631 91.743 100.931 94.4886 102.077 96.9837C103.223 99.4789 105.164 101.612 107.655 103.112C110.145 104.612 113.073 105.413 116.069 105.413C116.53 105.413 116.76 105.413 116.955 105.409C127.482 105.2 135.966 96.7164 136.175 86.1895C136.179 85.9945 136.179 85.764 136.179 85.3029V81.8271L136.179 44.8277Z"
                fill="#3313F7"
            />
        </svg>
    );
}
