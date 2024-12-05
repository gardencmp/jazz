import { DemoAuthBasicUI, createJazzVueApp, useDemoAuth } from "jazz-vue";
import { createApp, defineComponent, h } from "vue";
import App from "./App.vue";
import "./index.css";
import router from "./router";

const Jazz = createJazzVueApp();
export const { useAccount, useCoState } = Jazz;
const { JazzProvider } = Jazz;

const RootComponent = defineComponent({
  name: "RootComponent",
  setup() {
    const { authMethod, state } = useDemoAuth();

    return () => [
      h(
        JazzProvider,
        {
          auth: authMethod.value,
          peer: "wss://cloud.jazz.tools/?key=chat-example-jazz@garden.co",
        },
        {
          default: () => h(App),
        },
      ),

      state.state !== "signedIn" &&
        h(DemoAuthBasicUI, {
          appName: "Jazz Chat",
          state,
        }),
    ];
  },
});

const app = createApp(RootComponent);

app.use(router);

app.mount("#app");
