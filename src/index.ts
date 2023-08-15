import { newRandomAgentSecret, AgentSecret, agentSecretToBytes, agentSecretFromBytes} from "cojson/src/crypto";
import React, { useCallback, useEffect, useState } from "react";

export function useLocalAuth(onCredential: (credentials: AgentSecret) => void) {
    const [displayName, setDisplayName] = useState<string>("");

    useEffect(() => {
        if (sessionStorage.credential) {
            const credential = JSON.parse(sessionStorage.credential);
            onCredential(credential);
        }
    }, [onCredential]);

    const signUp = useCallback(() => {
        (async function () {
            const credential = newRandomAgentSecret();

            console.log(credential);

            const webAuthNCredential = await navigator.credentials.create({
                publicKey: {
                    challenge: Uint8Array.from([0, 1, 2]),
                    rp: {
                        name: "TodoApp",
                        // TODO: something safer as default?
                        id: window.location.hostname,
                    },
                    user: {
                        id: agentSecretToBytes(credential),
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
                agentSecretToBytes(credential)
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
                    // TODO: something safer as default?
                    rpId: window.location.hostname,
                    allowCredentials: [],
                    timeout: 60000,
                },
            });

            const userIdBytes = new Uint8Array(
                (webAuthNCredential as any).response.userHandle
            );
            const credential =
                agentSecretFromBytes(userIdBytes);

            if (!credential) {
                throw new Error("Invalid credential");
            }

            sessionStorage.credential = JSON.stringify(credential);
            onCredential(credential);
        })();
    }, []);

    return { displayName, setDisplayName, signUp, signIn };
}