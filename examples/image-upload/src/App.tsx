import ImageUpload from "./ImageUpload.tsx";
import { useAccount } from "./main";

function App() {
  const { me, logOut } = useAccount();

  return (
    <div className="container">
      <nav>
        <span>
          You're logged in as <strong>{me?.profile?.name}</strong>
        </span>
        <button onClick={() => logOut()}>Logout</button>
      </nav>
      <main>
        <ImageUpload />
      </main>
    </div>
  );
}

export default App;
