import { useIframeHashRouter } from "hash-slash";
import { ID } from "jazz-tools";
import { CreateOrder } from "./CreateOrder.tsx";
import { EditOrder } from "./EditOrder.tsx";
import { useAccount } from "./main";
import { BubbleTeaOrder } from "./schema.ts";

function App() {
  const { me, logOut } = useAccount();
  const router = useIframeHashRouter();

  return (
    <>
      <header>
        <nav className="container">
          <span>
            You're logged in as <strong>{me?.profile?.name}</strong>
          </span>
          <button className="btn" onClick={() => logOut()}>
            Log out
          </button>
        </nav>
      </header>

      <main className="container">
        {router.route({
          "/": () => <CreateOrder />,
          "/order/:id": (id) => <EditOrder id={id as ID<BubbleTeaOrder>} />,
        })}
      </main>
    </>
  );
}

export default App;
