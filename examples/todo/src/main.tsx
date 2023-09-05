import React from "react";
import ReactDOM from "react-dom/client";

import { WithJazz } from "jazz-react";
import { LocalAuth } from "jazz-react-auth-local";

import { PrettyAuthComponent } from "./components/prettyAuth.tsx";
import { ThemeProvider } from "./components/themeProvider.tsx";
import { Toaster } from "./components/ui/toaster.tsx";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ThemeProvider>
            <div className="flex items-center gap-2 justify-center mt-5">
                <img src="jazz-logo.png" className="h-5" /> Jazz Todo List
                Example
            </div>
            <WithJazz
                auth={LocalAuth({
                    appName: "Jazz Todo List Example",
                    Component: PrettyAuthComponent,
                })}
                syncAddress={
                    new URLSearchParams(window.location.search).get("sync") ||
                    undefined
                }
            >
                <App />
                <Toaster />
            </WithJazz>
        </ThemeProvider>
    </React.StrictMode>
);
