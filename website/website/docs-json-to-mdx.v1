import { readFile, writeFile } from "fs/promises";
import path from "path";

async function convertJsonToMdx() {
  const jsonContent = await readFile(
    path.join("docs-typedoc", "jazz-browser-media-images.json"),
    "utf-8",
  );
  const data = JSON.parse(jsonContent);

  const createImageFunction = data.children.find(
    (child) => child.name === "createImage",
  );
  const { name, signatures } = createImageFunction;
  const [signature] = signatures;

  const categoryTitle = data.categories.find((cat) =>
    cat.children.includes(createImageFunction.id),
  ).title;
  const today = new Date().toISOString().split("T")[0];

  const mdxContent = `---
kind: "api"
title: ${categoryTitle}
publishedAt: "${today}"
summary: TODO!
---

## ${name}

\`\`\`typescript
${name}(${signature.parameters.map((param) => param.name).join(", ")}): ${signature.type.name}<${signature.type.typeArguments[0].name}>

${signature.parameters.map((param) => `${param.name}: ${param.type.types ? param.type.types.map((t) => t.name).join(" | ") : param.type.name}`).join(",\n")}
\`\`\`
`;

  await writeFile(
    path.join("src/app/docs/api/(content)/jazz-browser-media-images.mdx"),
    mdxContent.trim(),
  );
  // const outputDir = path.join("src/app/docs/api/(content)");
  // const outputFilePath = path.join(outputDir, `${name}.mdx`);
  // await writeFile(outputFilePath, mdxContent.trim());
}

convertJsonToMdx();
