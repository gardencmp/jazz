import { useIframeHashRouter } from "hash-slash";
import { Group, ID, Marks } from "jazz-tools";
import { DocumentComponent } from "./Document";
import { useAccount } from "./main";
import { Document } from "./schema";

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

export default App;
