import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { StrictMode, useEffect, useRef } from "react";

import { DemoAuthBasicUI, useDemoAuth } from "jazz-react-native";
import { Jazz } from "./jazz";
import { SimpleSharing } from "./screens/SimpleSharing";

const Stack = createNativeStackNavigator();

function App() {
  const [auth, state] = useDemoAuth();
  const navigationRef = useNavigationContainerRef();
  const signedUp = useRef(false);

  useEffect(() => {
    if (state.state === "ready" && !signedUp.current) {
      if (state.existingUsers.includes("Mister X")) {
        state.logInAs("Mister X");
      } else {
        state.signUp("Mister X");
      }

      signedUp.current = true;
    }
  }, [state.state]);

  if (state.state === "ready" || !auth) {
    return null;
  }

  return (
    <StrictMode>
      <Jazz.Provider
        auth={auth}
        peer="wss://cloud.jazz.tools/?key=e2e-rn@garden.co"
        storage={undefined}
      >
        <NavigationContainer ref={navigationRef}>
          <Stack.Navigator initialRouteName="SimpleSharing">
            <Stack.Screen name="SimpleSharing" component={SimpleSharing} />
          </Stack.Navigator>
        </NavigationContainer>
      </Jazz.Provider>
    </StrictMode>
  );
}

export default App;
