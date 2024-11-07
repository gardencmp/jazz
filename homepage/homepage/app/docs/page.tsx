import { Prose } from "gcmp-design-system/src/app/components/molecules/Prose";
import plm, { toc } from "./guide/page.mdx";

export default function Page() {
    // console.log("plm", plm);
    // console.log("toc", toc);
    return (
        <Prose>
            <h1>Welcome to the Jazz documentation.</h1>
            <p>
                The Jazz docs are currently heavily work in progress, sorry
                about that!
            </p>
            <p>The best ways to get started are:</p>
            <ul>
                <li>
                    Quickstart (incomplete)
                    <ol>
                        <li>
                            <a href="/docs/sync-and-storage">
                                Sync & Storage Setup
                            </a>
                        </li>
                        <li>
                            <a href="/docs/project-setup/react">
                                React Project Setup
                            </a>
                        </li>
                        <li>
                            <a href="/docs/schemas/covalues">
                                CoValue Basics & Schema Definition
                            </a>
                        </li>
                        <li>
                            <span className="opacity-50">
                                Creating Covalues
                            </span>
                        </li>
                        <li>
                            <span className="opacity-50">Using Covalues</span>
                        </li>
                    </ol>
                </li>
                <li>
                    The step-by-step <a href="/docs/guide">Guide</a>{" "}
                    (incomplete)
                </li>
            </ul>
            <p>Also make sure to:</p>
            <ul>
                <li>
                    Find an <a href="/docs/examples">example app with code</a>{" "}
                    most similar to what you want to build
                </li>
                <li>
                    Check out the{" "}
                    <a href="/docs/api-reference">API Reference</a> (incomplete)
                </li>
            </ul>
            <p>
                And the best way to get help is to join the{" "}
                <a href="https://discord.gg/utDMjHYg42">Discord</a>!
            </p>
        </Prose>
    );
}
