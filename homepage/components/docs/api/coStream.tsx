import {
    Highlight,
    Class,
    PropDecl,
    ClassRef,
    PropRef,
    PropCategory,
    FnDecl,
    NewCoValueExplainer,
    RefValueExplainer,
} from "@/components/docs/tags";

export function CoStreamDocs() {
    return (
        <>
            <Class
                name="CoStream<Item>"
                doc="CoStreams are a collection of independent append-only streams per participant."
            >
                <PropCategory name="Declaration" />

                <pre className="text-xs mt-4">
                    <Highlight>
                        {`import { co, CoStream } from "jazz-tools";

class Reactions extends CoStream.Of(co.string) {}

class Inbox extends CoStream.Of(co.ref(Message)) {}`}
                    </Highlight>
                </pre>

                <PropCategory name="Contents" />

                <PropDecl
                    name={`[key: ID<Account>]`}
                    type={`{
    value?: Item,
    ref?: RefIfCoValue<Item>,
    madeAt: Date,
    all: IterableIterator<{ value?: Item; ... }>
}`}
                />

                <PropDecl
                    name={`perSession`}
                    type={`{ [key: SessionID]: {
        value?: Item,
        ref?: RefIfCoValue<Item>,
        madeAt: Date,
        all: IterableIterator<{ value?: Item; ... }>
} }`}
                />
            </Class>

            <Class
                name="BinaryCoStream"
                doc="BinaryCoStreams represent binary files and live streams."
            >
bla
            </Class>
        </>
    );
}
