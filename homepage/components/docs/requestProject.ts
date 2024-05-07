import { readFile } from "fs/promises";
import { ProjectReflection, Deserializer, JSONOutput } from "typedoc";

import JazzToolsDocs from "../../typedoc/jazz-tools.json";
import JazzReactDocs from "../../typedoc/jazz-react.json";
import JazzBrowserDocs from "../../typedoc/jazz-browser.json";
import JazzBrowserMediaImagesDocs from "../../typedoc/jazz-browser-media-images.json";
import JazzNodejsDocs from "../../typedoc/jazz-nodejs.json";

const docs = {
    "jazz-tools": JazzToolsDocs as JSONOutput.ProjectReflection,
    "jazz-react": JazzReactDocs as JSONOutput.ProjectReflection,
    "jazz-browser": JazzBrowserDocs as JSONOutput.ProjectReflection,
    "jazz-browser-media-images":
        JazzBrowserMediaImagesDocs as JSONOutput.ProjectReflection,
    "jazz-nodejs": JazzNodejsDocs as JSONOutput.ProjectReflection,
};

export async function requestProject(
    packageName: keyof typeof docs
): Promise<ProjectReflection> {
    const deserializer = new Deserializer({} as any);
    return deserializer.reviveProject(docs[packageName], packageName);
}
