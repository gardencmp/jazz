import { ReactNode } from "react";
import { Button } from "./ui/button";

export function FileUploadButton(props: {
    onFileLoad: (files: FileList) => Promise<void>;
    children: ReactNode;
}) {
    async function handleFileLoad(evt: React.ChangeEvent<HTMLInputElement>) {
        if (!evt.target.files) return;

        await props.onFileLoad(evt.target.files);

        evt.target.value = "";
    }

    return (
        <Button>
            <label className="flex items-center  cursor-pointer p-2">
                <input type="file" onChange={handleFileLoad} multiple hidden />
                {props.children}
            </label>
        </Button>
    );
}
