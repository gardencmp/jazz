import React, { ChangeEvent, useCallback, useState } from "react";
import ReactDOM from "react-dom/client";
import {
    RouterProvider,
    createHashRouter,
    useNavigate,
    useParams,
} from "react-router-dom";
import "./index.css";

import { WithJazz, useJazz, useAcceptInvite, useAutoSub } from "jazz-react";
import { LocalAuth } from "jazz-react-auth-local";

import {
    Button,
    Input,
    ThemeProvider,
    TitleAndLogo,
} from "./basicComponents/index.ts";
import { PrettyAuthUI } from "./components/Auth.tsx";
import { FileBundle } from "./1_types.ts";
import {
    createBinaryStreamFromBlob,
    readBlobFromBinaryStream,
} from "jazz-browser";
import { DownloadIcon } from "lucide-react";

const appName = "Jazz File Drop Example";

const auth = LocalAuth({
    appName,
    Component: PrettyAuthUI,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider>
            <TitleAndLogo name={appName} />
            <div className="flex flex-col h-full items-center justify-start gap-10 pt-10 pb-10 px-5">
                <WithJazz auth={auth}>
                    <App />
                </WithJazz>
            </div>
        </ThemeProvider>
    </React.StrictMode>
);

function App() {
    // logOut logs out the AuthProvider passed to `<WithJazz/>` above.
    const { logOut } = useJazz();

    const router = createHashRouter([
        {
            path: "/",
            element: <FileDropUI />,
        },
        {
            path: "/bundle/:bundleId",
            element: <FileDropUIPage />,
        },
        {
            path: "/invite/*",
            element: <p>Accepting invite...</p>,
        },
    ]);

    // `useAcceptInvite()` is a hook that accepts an invite link from the URL hash,
    // and on success calls our callback where we navigate to the project that we were just invited to.
    useAcceptInvite((bundleId) => router.navigate("/v/" + bundleId));

    return (
        <>
            <RouterProvider router={router} />

            <Button
                onClick={() => router.navigate("/").then(logOut)}
                variant="outline"
            >
                Log Out
            </Button>
        </>
    );
}

export function FileDropUIPage() {
    const { bundleId } = useParams<{ bundleId: FileBundle["id"] }>();

    return <FileDropUI bundleId={bundleId} />;
}

export function FileDropUI({ bundleId }: { bundleId?: FileBundle["id"] }) {
    const navigate = useNavigate();
    const { me, localNode } = useJazz();
    const fileBundle = useAutoSub(bundleId);

    const [progressMessage, setProgressMessage] = useState<{
        [name: string]: string;
    }>({});

    const onChange = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            let fileBundleToUse = fileBundle?.meta.coValue;
            let isFirstUpload = false;

            if (!fileBundleToUse) {
                const group = me.createGroup().addMember("everyone", "reader");
                fileBundleToUse = group.createMap<FileBundle>();
                isFirstUpload = true;
            }

            const files = [...(event.target.files || [])];

            Promise.all(
                files.map((file) =>
                    createBinaryStreamFromBlob(
                        file,
                        fileBundleToUse!.group,
                        { type: "binary" },
                        (progress) =>
                            setProgressMessage((old) => ({
                                ...old,
                                [file.name]: `Creating ${Math.round(
                                    progress * 100
                                )}%`,
                            }))
                    ).then((stream) => {
                        fileBundleToUse!.set(file.name, stream.id);
                    })
                )
            ).then(() => {
                if (isFirstUpload) {
                    navigate("/bundle/" + fileBundleToUse!.id);
                }
            });

            event.target.value = "";
        },
        [me, navigate, fileBundle]
    );

    return (
        <div className="max-w-full p-5 w-[40rem]">
            <h1 className="text-3xl font-bold mb-5">File Drop</h1>
            {[
                ...new Set([
                    ...Object.keys(fileBundle || {}),
                    ...Object.keys(progressMessage),
                ]),
            ].map((name) => (
                <div className="mb-5 flex justify-between" key={name}>
                    {name} {progressMessage[name]}
                    <Button
                        size="sm"
                        disabled={!(name in (fileBundle || {}))}
                        onClick={() => {
                            const streamId = fileBundle?.meta.coValue.get(name);
                            streamId &&
                                readBlobFromBinaryStream(
                                    streamId,
                                    localNode,
                                    false,
                                    (progress) =>
                                        setProgressMessage((old) => ({
                                            ...old,
                                            [name]: `Loading ${Math.round(
                                                progress * 100
                                            )}%`,
                                        }))
                                ).then((blob) => {
                                    if (!blob) return;
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, "_blank");
                                });
                        }}
                    >
                        <DownloadIcon />
                    </Button>
                </div>
            ))}
            {(!fileBundle || fileBundle.meta.group.myRole() === "admin") && (
                <Input type="file" onChange={onChange} multiple />
            )}
        </div>
    );
}

/** Walkthrough: Continue with ./3_NewProjectForm.tsx */
