import { CoMap, CoList, co, Group, ID, CoPlainText } from "jazz-tools";
import { createJazzReactContext, DemoAuth } from "jazz-react";
import { createRoot } from "react-dom/client";
import { useIframeHashRouter } from "hash-slash";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export class Document extends CoPlainText {}

const Jazz = createJazzReactContext({
    auth: DemoAuth({ appName: "Jazz Richtext Doc" }),
    peer: `wss://mesh.jazz.tools/?key=you@example.com`,
});
export const { useAccount, useCoState } = Jazz;

function App() {
    const { me, logOut } = useAccount();

    const createDocument = () => {
        const group = Group.create({ owner: me });
        group.addMember("everyone", "writer");
        const Doc = Document.create("", { owner: group });
        location.hash = "/doc/" + Doc.id;
    };

    return (
        <div className="flex flex-col items-center justify-between w-screen h-screen p-2 dark:bg-black dark:text-white">
            <div className="rounded mb-5 px-2 py-1 text-sm self-end">
                {me.profile?.name} · <button onClick={logOut}>Log Out</button>
            </div>
            {useIframeHashRouter().route({
                "/": () => createDocument() as never,
                "/doc/:id": (id) => (
                    <DocumentComponent docID={id as ID<Document>} />
                ),
            })}
        </div>
    );
}

createRoot(document.getElementById("root")!).render(
    <Jazz.Provider>
        <App />
    </Jazz.Provider>
);

import {
    EditorState,
    Transaction as ProsemirrorTransaction,
} from "prosemirror-state";
import { Node as ProsemirrorNode } from "prosemirror-model";
import { ReplaceStep } from "prosemirror-transform";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import "prosemirror-view/style/prosemirror.css";

function DocumentComponent({ docID }: { docID: ID<Document> }) {
    const { me } = useAccount();
    const [mount, setMount] = useState<HTMLElement | null>(null);

    console.log("rerendering");

    useEffect(() => {
        if (!mount) return;

        console.log("Creating EditorView");
        const editorView = new EditorView(mount, {
            state: EditorState.create({
                doc: undefined,
                schema: schema,
                plugins: exampleSetup({ schema, history: false }),
            }),
            dispatchTransaction(tr) {
                const expectedNewState = editorView.state.apply(tr);

                if (lastDoc) {
                    applyTxToPlainText(lastDoc, tr);
                }

                console.log(
                    "Setting view state to normal new state",
                    expectedNewState
                );

                editorView.updateState(expectedNewState);
            },
        });

        let lastDoc: Document | undefined;

        const unsub = Document.subscribe(docID, me, (doc) => {
            lastDoc = doc;

            console.log(
                "Applying doc update",
                doc,
                plainTextToProsemirrorDoc(doc)
            );

            const focusedBefore = editorView.hasFocus();

            editorView.updateState(
                EditorState.create({
                    doc: plainTextToProsemirrorDoc(doc),
                    plugins: editorView.state.plugins,
                    selection: editorView.state.selection,
                    schema: editorView.state.schema,
                    storedMarks: editorView.state.storedMarks,
                })
            );

            if (focusedBefore) {
                editorView.focus();
            }
        });

        return () => {
            console.log("Destroying");
            editorView.destroy();
            unsub();
        };
    }, [mount, docID, !!me]);

    return (
        <div>
            <h1>Document</h1>
            <div ref={setMount} className="border min-w-96 p-5" />
        </div>
    );
}

function plainTextToProsemirrorDoc(text: CoPlainText): ProsemirrorNode {
    return schema.node(
        "paragraph",
        undefined,
        text.toString().length === 0 ? undefined : schema.text(text.toString())
    );
}

function applyTxToPlainText(text: CoPlainText, tr: ProsemirrorTransaction) {
    for (const step of tr.steps) {
        if (step instanceof ReplaceStep) {
            console.log(step);
            if (step.from !== step.to) {
                text.deleteRange({ from: step.from, to: step.to });
            }
            if (step.slice.content.firstChild?.text) {
                text.insertAfter(step.from, step.slice.content.firstChild.text);
            }
        } else {
            console.warn("Unsupported step type", step);
        }
    }
}
