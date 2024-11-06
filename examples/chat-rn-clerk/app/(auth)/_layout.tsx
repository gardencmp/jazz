import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/auth-context";

export default function UnAuthenticatedLayout() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect href={"/chat"} />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
        headerTitle: "",
      }}
    />
  );
}
