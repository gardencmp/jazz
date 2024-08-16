import { ReactNode } from "react";

export function Button(props: { onClick?: () => void; children: ReactNode }) {
    return (
        <button
            onClick={props.onClick}
            className="p-2 bg-blue-300 hover:cursor-pointer flex items-center"
        >
            {props.children}
        </button>
    );
}
