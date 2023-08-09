import { AgentCredential, internals as cojsonInternals } from "cojson";
import React, { useCallback, useEffect, useState } from "react";

export function useLocalAuth(onCredential: (credentials: AgentCredential) => void) {
    const [displayName, setDisplayName] = useState<string>("");

    useEffect(() => {
        if (sessionStorage.credential) {
            const credential = JSON.parse(sessionStorage.credential);
            onCredential(credential);
        }
    }, [onCredential]);

    const signUp = useCallback(() => {
        (async function () {
            const credential = cojsonInternals.newRandomAgentCredential();

            console.log(credential);

            const webAuthNCredential = await navigator.credentials.create({
                publicKey: {
                    challenge: Uint8Array.from([0, 1, 2]),
                    rp: {
                        name: "TodoApp",
                        id: "localhost",
                    },
                    user: {
                        id: cojsonInternals.agentCredentialToBytes(credential),
                        name: displayName,
                        displayName: displayName,
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: {
                        authenticatorAttachment: "platform",
                    },
                    timeout: 60000,
                    attestation: "direct",
                },
            });

            console.log(
                webAuthNCredential,
                credential,
                cojsonInternals.agentCredentialToBytes(credential)
            );

            sessionStorage.credential = JSON.stringify(credential);
            onCredential(credential);
        })();
    }, [displayName]);

    const signIn = useCallback(() => {
        (async function () {
            const webAuthNCredential = await navigator.credentials.get({
                publicKey: {
                    challenge: Uint8Array.from([0, 1, 2]),
                    rpId: "localhost",
                    allowCredentials: [],
                    timeout: 60000,
                },
            });

            const userIdBytes = new Uint8Array(
                (webAuthNCredential as any).response.userHandle
            );
            const credential =
                cojsonInternals.agentCredentialFromBytes(userIdBytes);

            if (!credential) {
                throw new Error("Invalid credential");
            }

            sessionStorage.credential = JSON.stringify(credential);
            onCredential(credential);
        })();
    }, []);

    return { displayName, setDisplayName, signUp, signIn };
}