import { ReactNode } from "react";

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
        <button className="p-2 bg-blue-300 hover:cursor-pointer flex items-center">
            <label className="flex items-center">
                <input type="file" onChange={handleFileLoad} multiple hidden />
                {props.children}
            </label>
        </button>
    );
}
