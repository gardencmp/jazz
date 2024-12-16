import { useIframeHashRouter } from "hash-slash";
import { DemoAuthBasicUI, createJazzReactApp, useDemoAuth } from "jazz-react";
import { CoRichText, Group, ID, Marks } from "jazz-tools";
import { createRoot } from "react-dom/client";
import { DocumentComponent } from "./document";

/**
 * Extends CoRichText to represent a collaborative rich text document.
 * Used as the underlying data structure for the ProseMirror editor.
 */
export class Document extends CoRichText {}

const Jazz = createJazzReactApp();
export const { useAccount, useCoState } = Jazz;

/**
 * Main component that sets up Jazz and authentication.
 * Provides the Jazz context and handles user authentication state.
 */
function JazzAndAuth({ children }: { children: React.ReactNode }) {
  const [auth, state] = useDemoAuth();

  return (
    <>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=richtext-example-jazz@gcmp.io"
      >
        {children}
      </Jazz.Provider>
      {state.state !== "signedIn" && (
        <DemoAuthBasicUI appName="Jazz Richtext Doc" state={state} />
      )}
    </>
  );
}

/**
 * Main application component that handles document creation and routing.
 * Creates a new document with initial paragraph mark when no document is selected.
 */
function App() {
  const { me, logOut } = useAccount();

  const createDocument = () => {
    const group = Group.create({ owner: me });
    group.addMember("everyone", "writer");
    const Doc = Document.createFromPlainTextAndMark(
      "",
      Marks.Paragraph,
      { tag: "paragraph" },
      { owner: me },
    );
    setTimeout(() => {
      location.hash = "/doc/" + Doc.id;
    }, 1000);
    return <div>Loading...</div>;
  };

  return (
    <div className="flex flex-col items-center w-screen h-screen p-2 dark:bg-black dark:text-white">
      <div className="rounded mb-5 px-2 py-1 text-sm self-end">
        {me.profile?.name} · <button onClick={logOut}>Log Out</button>
      </div>
      {useIframeHashRouter().route({
        "/": () => createDocument(),
        "/doc/:id": (id) => <DocumentComponent docID={id as ID<Document>} />,
      })}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <JazzAndAuth>
    <App />
  </JazzAndAuth>,
);
