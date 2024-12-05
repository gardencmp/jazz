import ImageUpload from "./ImageUpload.tsx";
import { useAccount } from "./main";

function App() {
  const { me, logOut } = useAccount();

  return (
    <>
      <header>
        <nav className="container">
          <span>
            You're logged in as <strong>{me?.profile?.name}</strong>
          </span>
          <button onClick={() => logOut()}>Log out</button>
        </nav>
      </header>
      <main className="container">
        <ImageUpload />
      </main>
    </>
  );
}

export default App;
