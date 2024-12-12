import { useIframeHashRouter } from "hash-slash";
import { ID } from "jazz-tools";
import { CreateOrder } from "./CreateOrder.tsx";
import { EditOrder } from "./EditOrder.tsx";
import { Orders } from "./Orders.tsx";
import { useAccount } from "./main";
import { BubbleTeaOrder } from "./schema.ts";

function App() {
  const { me, logOut } = useAccount();
  const router = useIframeHashRouter();

  return (
    <>
      <header>
        <nav className="container py-2 border-b flex items-center justify-between">
          <span>
            You're logged in as <strong>{me?.profile?.name}</strong>
          </span>
          <button
            className="bg-stone-100 py-1.5 px-3 text-sm rounded-md dark:bg-stone-900 dark:text-white"
            onClick={() => logOut()}
          >
            Log out
          </button>
        </nav>
      </header>

      <main className="container py-8 space-y-8">
        {router.route({
          "/": () => <Orders />,
          "/order": () => <CreateOrder />,
          "/order/:id": (id) => <EditOrder id={id as ID<BubbleTeaOrder>} />,
        })}
      </main>
    </>
  );
}

export default App;
