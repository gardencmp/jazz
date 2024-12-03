import { useAccount } from "./main";

function App() {
  const { me, logOut } = useAccount();

  return (
    <div className="container">
      <h1>You're logged in</h1>
      <p>Welcome back, {me?.profile?.name}</p>
      <button onClick={() => logOut()}>Logout</button>
    </div>
  );
}

export default App;
