import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { WithJazz } from "jazz-react";
import { LocalAuth } from "jazz-react-auth-local";
import { PrettyAuthComponent } from "./components/prettyAuth.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <WithJazz
            auth={LocalAuth({
                appName: "Todo List Example",
                Component: PrettyAuthComponent,
            })}
            syncAddress={
                new URLSearchParams(window.location.search).get("sync") ||
                undefined
            }
        >
            <App />
        </WithJazz>
    </React.StrictMode>
);

