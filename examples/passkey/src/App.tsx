import { useAccount } from "./main";

function App() {
  const { me, logOut } = useAccount();

  return (
    <main>
      <h1>You're logged in</h1>
      <p>Welcome back, {me?.profile?.name}!</p>
      <button onClick={() => logOut()}>Logout</button>
    </main>
  );
}

export default App;
