import { useIframeHashRouter } from "hash-slash";
import { useAccount } from "./main";

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
          "/": () => <div>Welcome</div>,
        })}
      </main>
    </>
  );
}

export default App;
