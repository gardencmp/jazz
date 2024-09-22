import { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

export function Link(props: { to: string; children: ReactNode }) {
    return (
        <RouterLink
            to={props.to}
            className="p-2 w-fit bg-blue-300 hover:cursor-pointer flex items-center"
        >
            {props.children}
        </RouterLink>
    );
}
