import "./index.css";
import { createApp, defineComponent, h } from "vue";
import { createJazzVueApp, useDemoAuth, DemoAuthBasicUI } from "jazz-vue";
import router from "./router";
import App from "./App.vue";

const Jazz = createJazzVueApp();
export const { useAccount, useCoState } = Jazz;
const { JazzProvider } = Jazz;

const RootComponent = defineComponent({
    name: "RootComponent",
    setup() {
        const demoAuth = useDemoAuth();

        return () => [
            h(
                JazzProvider,
                {
                    auth: demoAuth[0].value,
                    peer: "wss://mesh.jazz.tools/?key=chat-example-jazz@gcmp.io",
                },
                {
                    default: () => h(App),
                },
            ),

            demoAuth[1].state !== "signedIn" &&
                h(DemoAuthBasicUI, {
                    appName: "Jazz Chat",
                    state: demoAuth[1],
                }),
        ];
    },
});

const app = createApp(RootComponent);

app.use(router);

app.mount("#app");
