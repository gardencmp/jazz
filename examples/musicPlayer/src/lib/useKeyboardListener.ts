import { useEffect } from "react";

export function useKeyboardListener(code: string, callback: () => void) {
    useEffect(() => {
        const handler = (evt: KeyboardEvent) => {
            if (evt.code === code) {
                callback();
            }
        };
        window.addEventListener("keyup", handler);

        return () => {
            window.removeEventListener("keyup", handler);
        };
    }, [callback, code]);
}
