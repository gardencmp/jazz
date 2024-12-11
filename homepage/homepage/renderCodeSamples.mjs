import path from "path";
import { mkdir, readFile, readdir, rm, writeFile } from "fs/promises";
import {
  createShikiHighlighter,
  renderCodeToHTML,
  runTwoSlash,
} from "shiki-twoslash";

const targetDoc = "app/examples/page.tsx";

const targetDocSrc = await readFile(targetDoc, "utf8");

await rm("./codeSamples", { recursive: true, force: true });

[...targetDocSrc.matchAll(/"@\/codeSamples\/(.+?)"/g)].forEach(
  async (match) => {
    const dir = match[1];

    console.log("Rendering", { dir });

    const allFiles = Object.fromEntries(
      (
        await Promise.all(
          (
            await readdir(path.join("../../", dir))
          ).map(async (f) => {
            if (f.endsWith(".json") || f === "vite-env.d.ts") return undefined;

            if (f.endsWith(".ts") || f.endsWith(".tsx")) {
              return [f, await readFile(path.join("../../", dir, f), "utf8")];
            }

            return undefined;
          }),
        )
      ).filter((entry) => entry !== undefined),
    );

    // console.log(allFiles);

    const components = (
      await Promise.all(
        Object.entries(allFiles).map(async ([filename, src]) => {
          const otherFilesConcat = Object.entries(allFiles)
            .filter(([f, _]) => f !== filename)
            .map(([f, src]) => `// @filename: ${f}\n// @errors: 2345\n${src}`)
            .join("\n\n");

          const forFile =
            otherFilesConcat +
            "\n\n// @filename: " +
            filename +
            "\n// @errors: 2345" +
            "\n// ---cut---\n" +
            src.trim();

          const highlighter = await createShikiHighlighter({
            theme: "css-variables",
          });

          const twoslash = runTwoSlash(forFile, "ts", {
            disableImplicitReactImport: true,
            defaultCompilerOptions: {
              allowImportingTsExtensions: true,
              noEmit: true,
              jsx: 4,
              strict: true,
              paths: {
                "jazz-tools": ["../../../packages/jazz-tools"],
                "jazz-react": ["../../../packages/jazz-react"],
                "hash-slash": ["../../../packages/hash-slash"],
                "jazz-browser-media-images": [
                  "../../../packages/jazz-browser-media-images",
                ],
              },
              types: [
                "../../../examples/image-upload/node_modules/vite/client",
                "../../../examples/reactions/node_modules/vite/client",
              ],
            },
          });
          const html = renderCodeToHTML(
            twoslash.code,
            "tsx",
            { twoslash: true },
            {
              themeName: "css-variables",
            },
            highlighter,
            twoslash,
          );

          const component = `export function ${
            path.basename(filename).slice(0, 1).toUpperCase() +
            path.basename(filename).slice(1).replace(".", "_")
          }() {\n\treturn <div className="not-prose h-full" dangerouslySetInnerHTML={{__html: \`${html
            .replace(/`/g, "\\`")
            .replace(/\$/g, "\\$")}\`\n\t}}/>;\n}`;

          return component;
        }),
      )
    ).join("\n\n");

    await mkdir(path.join("./codeSamples/", dir), {
      recursive: true,
    });
    await writeFile(
      path.join("./codeSamples/", dir, "index.tsx"),
      components,
      "utf8",
    );
  },
);
