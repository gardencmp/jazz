import React from "react";
import type { SVGProps } from "react";

export function NodejsLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 128 128"
            {...props}
        >
            <path
                fill="url(#deviconNodejs0)"
                d="M66.958.825a6.07 6.07 0 0 0-6.035 0L11.103 29.76c-1.895 1.072-2.96 3.095-2.96 5.24v57.988c0 2.143 1.183 4.167 2.958 5.24l49.82 28.934a6.07 6.07 0 0 0 6.036 0l49.82-28.935c1.894-1.072 2.958-3.096 2.958-5.24V35c0-2.144-1.183-4.167-2.958-5.24z"
            ></path>
            <path
                fill="url(#deviconNodejs1)"
                d="M116.897 29.76L66.841.825A8 8 0 0 0 65.302.23L9.21 96.798a6.3 6.3 0 0 0 1.657 1.43l50.057 28.934c1.42.833 3.076 1.072 4.615.595l52.66-96.925a3.7 3.7 0 0 0-1.302-1.072"
            ></path>
            <path
                fill="url(#deviconNodejs2)"
                d="M116.898 98.225c1.42-.833 2.485-2.262 2.958-3.81L65.066.108c-1.42-.238-2.959-.119-4.26.715L11.104 29.639l53.606 98.355c.71-.12 1.54-.358 2.25-.715z"
            ></path>
            <defs>
                <linearGradient
                    id="deviconNodejs0"
                    x1={34.513}
                    x2={27.157}
                    y1={15.535}
                    y2={30.448}
                    gradientTransform="translate(-129.242 -73.715)scale(6.18523)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor="#3f873f"></stop>
                    <stop offset={0.33} stopColor="#3f8b3d"></stop>
                    <stop offset={0.637} stopColor="#3e9638"></stop>
                    <stop offset={0.934} stopColor="#3da92e"></stop>
                    <stop offset={1} stopColor="#3dae2b"></stop>
                </linearGradient>
                <linearGradient
                    id="deviconNodejs1"
                    x1={30.009}
                    x2={50.533}
                    y1={23.359}
                    y2={8.288}
                    gradientTransform="translate(-129.242 -73.715)scale(6.18523)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset={0.138} stopColor="#3f873f"></stop>
                    <stop offset={0.402} stopColor="#52a044"></stop>
                    <stop offset={0.713} stopColor="#64b749"></stop>
                    <stop offset={0.908} stopColor="#6abf4b"></stop>
                </linearGradient>
                <linearGradient
                    id="deviconNodejs2"
                    x1={21.917}
                    x2={40.555}
                    y1={22.261}
                    y2={22.261}
                    gradientTransform="translate(-129.242 -73.715)scale(6.18523)"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop offset={0.092} stopColor="#6abf4b"></stop>
                    <stop offset={0.287} stopColor="#64b749"></stop>
                    <stop offset={0.598} stopColor="#52a044"></stop>
                    <stop offset={0.862} stopColor="#3f873f"></stop>
                </linearGradient>
            </defs>
        </svg>
    );
}
