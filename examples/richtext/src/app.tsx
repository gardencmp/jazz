import { Group, ID, CoRichText, Marks, TreeNode, TreeLeaf } from "jazz-tools";
import { createJazzReactContext, DemoAuth } from "jazz-react";
import { createRoot } from "react-dom/client";
import { useIframeHashRouter } from "hash-slash";
import { useEffect, useState } from "react";

export class Document extends CoRichText {}

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
        const Doc = Document.createFromPlainTextAndMark("", Marks.Paragraph, {tag: "paragraph"}, { owner: me });
        setTimeout(() => {
            location.hash = "/doc/" + Doc.id;
        }, 1000);
    };

    return (
        <div className="flex flex-col items-center w-screen h-screen p-2 dark:bg-black dark:text-white">
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
    TextSelection,
} from "prosemirror-state";
import {
    Node as ProsemirrorNode,
    Mark as ProsemirrorMark,
} from "prosemirror-model";
import { ReplaceStep, AddMarkStep } from "prosemirror-transform";
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

        const setupPlugins = exampleSetup({ schema, history: false });
        console.log("setupPlugins", setupPlugins, schema);

        const editorView = new EditorView(mount, {
            state: EditorState.create({
                doc: schema.node("doc", undefined, [
                    schema.node("paragraph", undefined, undefined),
                ]),
                schema: schema,
                plugins: setupPlugins,
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

        const unsub = Document.subscribe(
            docID,
            me,
            { text: true, marks: [[]] },
            (doc) => {
                lastDoc = doc;

                console.log("Applying doc update");
                console.log(
                    "marks",
                    doc.toString(),
                    doc.resolveAndDiffuseAndFocusMarks()
                );
                console.log("tree", doc.toTree(["strong", "em"]));

                console.log(richTextToProsemirrorDoc(doc));

                const focusedBefore = editorView.hasFocus();

                editorView.updateState(
                    EditorState.create({
                        doc: richTextToProsemirrorDoc(doc),
                        plugins: editorView.state.plugins,
                        selection: editorView.state.selection,
                        schema: editorView.state.schema,
                        storedMarks: editorView.state.storedMarks,
                    })
                );

                if (focusedBefore) {
                    editorView.focus();
                }
            }
        );

        return () => {
            console.log("Destroying");
            editorView.destroy();
            unsub();
        };
    }, [mount, docID, !!me]);

    return (
        <div>
            <h1>Document</h1>
            <div ref={setMount} className="border min-w-96 p-5 min-h-96" />
        </div>
    );
}

function richTextToProsemirrorDoc(
    text: CoRichText
): ProsemirrorNode | undefined {
    const asString = text.toString();
    return schema.node("doc", undefined, [
        schema.node(
            "paragraph",
            { start: 0, end: asString.length },
            asString.length === 0
                ? undefined
                : text.toTree(["strong", "em"]).children.map((child) => {
                      if (
                          child.type === "leaf" ||
                          child.tag === "strong" ||
                          child.tag === "em"
                      ) {
                          return collectInlineMarks(asString, child, []);
                      } else {
                          throw new Error("Unsupported tag " + child.tag);
                      }
                  })
        ),
    ]);
}

function collectInlineMarks(
    fullString: string,
    node: TreeNode | TreeLeaf,
    currentMarks: ProsemirrorMark[]
) {
    if (node.type === "leaf") {
        return schema.text(
            fullString.slice(node.start, node.end),
            currentMarks
        );
    } else {
        if (node.tag === "strong") {
            return collectInlineMarks(
                fullString,
                node.children[0],
                currentMarks.concat(schema.mark("strong"))
            );
        } else if (node.tag === "em") {
            return collectInlineMarks(
                fullString,
                node.children[0],
                currentMarks.concat(schema.mark("em"))
            );
        } else {
            throw new Error("Unsupported tag " + node.tag);
        }
    }
}

function applyTxToPlainText(text: CoRichText, tr: ProsemirrorTransaction) {
    console.log("transaction", tr);
    for (const step of tr.steps) {
        if (step instanceof ReplaceStep) {
            const resolvedStart = tr.before.resolve(step.from);
            const resolvedEnd = tr.before.resolve(step.to);

            const selectionToStart = TextSelection.between(
                tr.before.resolve(0),
                resolvedStart
            );
            const start = selectionToStart
                .content()
                .content.textBetween(
                    0,
                    selectionToStart.content().content.size
                ).length;

            const selectionToEnd = TextSelection.between(
                tr.before.resolve(0),
                resolvedEnd
            );
            const end = selectionToEnd
                .content()
                .content.textBetween(
                    0,
                    selectionToEnd.content().content.size
                ).length;

            console.log(
                "step",
                step,
                resolvedStart,
                resolvedEnd,
                selectionToStart,
                start,
                end
            );

            if (start === end) {
                if (step.slice.content.firstChild?.text) {
                    text.insertAfter(start, step.slice.content.firstChild.text);
                } else {
                    // this is a split operation
                    const splitNodeType =
                        step.slice.content.firstChild?.type.name;
                    if (splitNodeType === "paragraph") {
                        const matchingMarks =
                            text.marks?.filter(
                                (m): m is Exclude<typeof m, null> =>
                                    !!m &&
                                    m.tag === "paragraph" &&
                                    (m.startAfter && text.idxAfter(m.startAfter) || 0) <
                                        start &&
                                    (m.endBefore && text.idxBefore(m.endBefore) || Infinity) >
                                        start
                            ) || [];

                        console.log("split before", start, matchingMarks);

                        let lastSeenEnd = start;
                        for (const matchingMark of matchingMarks) {
                            const originalEnd = text.idxAfter(
                                matchingMark.endAfter
                            )!; // TODO: non-tight case
                            if (originalEnd > lastSeenEnd) {
                                lastSeenEnd = originalEnd;
                            }
                            matchingMark.endBefore = text.posBefore(start + 1)!;
                            matchingMark.endAfter = text.posAfter(start)!;
                        }

                        console.log("split after", matchingMarks, lastSeenEnd);

                        text.insertMark(start, lastSeenEnd, Marks.Paragraph, {
                            tag: "paragraph",
                        });
                    } else {
                        console.warn(
                            "Unknown node type to split",
                            splitNodeType
                        );
                    }
                }
            } else {
                text.deleteRange({ from: start, to: end });
            }
        } else if (step instanceof AddMarkStep) {
            console.log("step", step);
            if (step.mark.type.name === "strong") {
                text.insertMark(step.from, step.to - 1, Marks.Strong, {
                    tag: "strong",
                });
            } else if (step.mark.type.name === "em") {
                text.insertMark(step.from, step.to - 1, Marks.Em, {
                    tag: "em",
                });
            } else {
                console.warn("Unsupported mark type", step.mark);
            }
        } else {
            console.warn("Unsupported step type", step);
        }
    }
}
