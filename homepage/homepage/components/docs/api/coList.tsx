import {
    Highlight,
    ClassOrInterface,
    PropDecl,
    ClassRef,
    PropRef,
    PropCategory,
    RefValueExplainer,
} from "@/components/docs/tags";

export function CoListDocs() {
    return (
        <>
            <ClassOrInterface
                name="CoList<Item> extends Array<Item>"
                doc="CoLists are collaborative versions of arrays."
            >
                <PropCategory name="Declaration" />

                <pre className="text-xs mt-4">
                    <Highlight>
                        {`import { co, CoList } from "jazz-tools";

class Colours extends CoList.Of(co.string) {}

class People extends CoList.Of(co.ref(Person)) {}`}
                    </Highlight>
                </pre>

                <PropCategory name="Contents" />

                <PropDecl
                    name={`coList[idx]`}
                    type={`Item`}
                    doc={
                        <>
                            <p>
                                The items in this <ClassRef name="CoList" />,
                                behaving like a regular array, so you can use
                                bracket notation to get/set them, and use
                                built-in Array methods like{" "}
                                <PropRef prop="map()" />,{" "}
                                <PropRef prop="filter()" />, etc.
                            </p>

                            <p>
                                <RefValueExplainer propName="items" />
                            </p>
                        </>
                    }
                />
                <PropDecl name={`coList.length`} type={`number`} />
                <PropDecl
                    name={`coList._refs`}
                    type={`{ [idx: number]: RefIfCoValue<Fields[Key]> }`}
                />

                <PropCategory name="Collaboration" />

                <PropDecl
                    name={`coList._edits`}
                    type={`{ [idx: number]: {
    value?: Item;
    ref?: RefIfCoValue<Item>;
    by?: Account;
    madeAt: Date;
} }`}
                    doc={
                        <>
                            <p className="mb-4">
                                Lets you access the edit history for each index
                                in this <ClassRef name="CoList" />. Directly
                                includes the current value, the{" "}
                                <ClassRef name="Ref" /> if the item is a
                                reference, the author{" "}
                                <ClassRef name="Account" />, and the timestamp.
                            </p>
                        </>
                    }
                />

                <PropDecl
                    name={`coList._owner`}
                    type={`Account | Group`}
                    doc={
                        <>
                            The <ClassRef name="Account" /> or{" "}
                            <ClassRef name="Group" /> that owns this{" "}
                            <ClassRef name="CoList" />.
                        </>
                    }
                />

                <PropCategory name="Type info" />

                <PropDecl
                    name={`coList._type`}
                    type={`"CoList"`}
                    doc={
                        <>
                            Distinguishes this as a <ClassRef name="CoMap" />{" "}
                            from other CoValues
                        </>
                    }
                />
                <PropDecl
                    name={`coList._schema`}
                    type={`{ [co.items]: SchemaFor<Item>; }`}
                    doc={
                        <>
                            Stores the schema of the items in this{" "}
                            <ClassRef name="CoList" />. Define with{" "}
                            <PropRef on="CoList" prop={"Of(...)"} /> and{" "}
                            <PropRef prop={"co(...)"} />.
                        </>
                    }
                />
            </ClassOrInterface>
        </>
    );
}
