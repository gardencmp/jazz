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
    const doc = useCoState(Document, docID);

    const [mount, setMount] = useState<HTMLElement | null>(null);

    const view = useRef<EditorView | null>(null);

    useEffect(() => {
        if (!mount || !doc) return;
        console.log("Creating EditorView");
        view.current = new EditorView(mount, {
            state: EditorState.create({
                doc: plainTextToProsemirrorDoc(doc),
            }),
            dispatchTransaction(tr) {
                if (!view.current) return;
                console.log("dispatchTransaction", tr);
                const expectedNewState = view.current!.state.apply(tr);

                console.log("doc before", doc.toString());

                applyTxToPlainText(doc, tr);

                console.log("doc after", doc.toString());

                view.current.updateState(
                    EditorState.create({
                        doc: plainTextToProsemirrorDoc(doc),
                        plugins: expectedNewState.plugins,
                        selection: expectedNewState.selection,
                        schema: expectedNewState.schema,
                    })
                );
            },
        });
        return () => view.current?.destroy();
    }, [mount, !!doc]);

    return (
        <>
            <h1>Document</h1>

            <div ref={setMount} className="border min-w-96" />
        </>
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
            if (step.from !== step.to) {
                text.deleteFrom(step.from, step.to - step.from);
            }
            text.insertAfter(step.from, step.slice.content.toString());
        }
    }
}
