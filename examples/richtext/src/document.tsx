import { CoRichText, ID, Marks, TreeLeaf, TreeNode } from "jazz-tools";
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import {
  Mark as ProsemirrorMark,
  Node as ProsemirrorNode,
} from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import {
  EditorState,
  Transaction as ProsemirrorTransaction,
  TextSelection,
} from "prosemirror-state";
import { AddMarkStep, ReplaceStep } from "prosemirror-transform";
import { EditorView } from "prosemirror-view";
import "prosemirror-view/style/prosemirror.css";
import { useEffect, useState } from "react";
import { Document, useAccount } from "./app";

/**
 * Component that integrates CoRichText with ProseMirror editor.
 * Handles bidirectional synchronization between Jazz and ProseMirror states.
 *
 * @param docID - The ID of the document to edit
 */
export function DocumentComponent({ docID }: { docID: ID<Document> }) {
  const { me } = useAccount();
  const [mount, setMount] = useState<HTMLElement | null>(null);

  console.log("rerendering");

  useEffect(() => {
    if (!mount) return;

    console.log("Creating EditorView");

    const setupPlugins = exampleSetup({ schema, history: false });
    // console.log("setupPlugins", setupPlugins, schema);

    // Create a new editor view
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

        console.log("Applying transaction", lastDoc);
        if (lastDoc) {
          console.log("Applying transaction to plain text");
          applyTxToPlainText(lastDoc, tr);
        }

        console.log("Setting view state to normal new state", expectedNewState);

        editorView.updateState(expectedNewState);
      },
    });

    let lastDoc: Document | undefined;

    console.log("About to subscribe to document:", docID, "with user:", me.id);
    const unsub = Document.subscribe(
      docID,
      me,
      { marks: [{}], text: [] },
      async (doc) => {
        console.log("doc", JSON.parse(JSON.stringify(doc)));

        console.log("doc loaded");

        lastDoc = doc;
        console.log("doc marks", JSON.parse(JSON.stringify(doc.marks)));
        console.log("doc text", JSON.parse(JSON.stringify(doc.text)));

        console.log("Applying doc update");
        console.log(
          "marks",
          doc.toString(),
          doc.resolveAndDiffuseAndFocusMarks(),
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
          }),
        );

        // Focus the editor after the state has been updated
        if (focusedBefore) {
          setTimeout(() => {
            editorView.focus();
          }, 0);
        }
      },
    );
    console.log("Subscription created successfully");

    return () => {
      console.log("Destroying");
      editorView.destroy();
      unsub();
    };
  }, [mount, docID, !!me]);

  return (
    <div>
      <h1>Document</h1>
      <div ref={setMount} className="border" />
    </div>
  );
}

/**
 * Converts a CoRichText document to a ProseMirror document node.
 * Currently supports basic inline marks (strong, em) within paragraphs.
 *
 * @param text - The CoRichText document to convert
 * @returns A ProseMirror document node, or undefined if conversion fails
 */
function richTextToProsemirrorDoc(
  text: CoRichText,
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
          }),
    ),
  ]);
}

/**
 * Recursively collects inline marks from a CoRichText tree node.
 * Handles leaf nodes (plain text) and mark nodes (strong, em).
 *
 * @param fullString - The complete document text
 * @param node - Current tree node being processed
 * @param currentMarks - Accumulated marks from parent nodes
 * @returns A ProseMirror text node with appropriate marks
 */
function collectInlineMarks(
  fullString: string,
  node: TreeNode | TreeLeaf,
  currentMarks: ProsemirrorMark[],
) {
  if (node.type === "leaf") {
    return schema.text(fullString.slice(node.start, node.end), currentMarks);
  } else {
    if (node.tag === "strong") {
      return collectInlineMarks(
        fullString,
        node.children[0],
        currentMarks.concat(schema.mark("strong")),
      );
    } else if (node.tag === "em") {
      return collectInlineMarks(
        fullString,
        node.children[0],
        currentMarks.concat(schema.mark("em")),
      );
    } else {
      throw new Error("Unsupported tag " + node.tag);
    }
  }
}

/**
 * Applies ProseMirror transactions to the underlying CoRichText document.
 * Handles text operations (insert, delete) and mark operations (add).
 *
 * @param text - The CoRichText document to modify
 * @param tr - The ProseMirror transaction to apply
 *
 * Supported operations:
 * - ReplaceStep: Text insertions and deletions
 * - AddMarkStep: Adding strong (bold) and em (italic) marks
 * - Paragraph splits: Creating new paragraph marks when Enter is pressed
 */
function applyTxToPlainText(text: CoRichText, tr: ProsemirrorTransaction) {
  console.log("transaction", tr);
  for (const step of tr.steps) {
    if (step instanceof ReplaceStep) {
      const resolvedStart = tr.before.resolve(step.from);
      const resolvedEnd = tr.before.resolve(step.to);

      const selectionToStart = TextSelection.between(
        tr.before.resolve(0),
        resolvedStart,
      );
      const start = selectionToStart
        .content()
        .content.textBetween(0, selectionToStart.content().content.size).length;

      const selectionToEnd = TextSelection.between(
        tr.before.resolve(0),
        resolvedEnd,
      );
      const end = selectionToEnd
        .content()
        .content.textBetween(0, selectionToEnd.content().content.size).length;

      console.log(
        "step",
        step,
        resolvedStart,
        resolvedEnd,
        selectionToStart,
        start,
        end,
      );

      if (start === end) {
        if (step.slice.content.firstChild?.text) {
          text.insertAfter(start, step.slice.content.firstChild.text);
        } else {
          // this is a split operation
          const splitNodeType = step.slice.content.firstChild?.type.name;
          if (splitNodeType === "paragraph") {
            const matchingMarks =
              text.marks?.filter(
                (m): m is Exclude<typeof m, null> =>
                  !!m &&
                  m.tag === "paragraph" &&
                  ((m.startAfter && text.idxAfter(m.startAfter)) || 0) <
                    start &&
                  ((m.endBefore && text.idxBefore(m.endBefore)) || Infinity) >
                    start,
              ) || [];

            console.log("split before", start, matchingMarks);

            let lastSeenEnd = start;
            for (const matchingMark of matchingMarks) {
              const originalEnd = text.idxAfter(matchingMark.endAfter)!; // TODO: non-tight case
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
            console.warn("Unknown node type to split", splitNodeType);
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
