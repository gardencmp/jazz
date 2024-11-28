import { useAccount } from "./main";

function App() {
  const { me, logOut } = useAccount();

  return (
    <>
      <h1>You're logged in</h1>
      <p>Welcome back, {me?.profile?.name}</p>
      <button onClick={() => logOut()}>Logout</button>
    </>
  );
}

export default App;
