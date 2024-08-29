import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { TypeDocProject, TypeDocDeclaration, TypeDocReadmeItem } from './typedoc-types';

function isTypeDocData(data: any): data is TypeDocProject {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    'variant' in data &&
    'kind' in data &&
    'flags' in data &&
    'children' in data &&
    'categories' in data &&
    'readme' in data &&
    'symbolIdMap' in data &&
    'files' in data
  );
}

async function createMdxContent(outputFilePath: string) {
  const jsonContent = await readFile(
    path.join('docs-typedoc', 'jazz-browser-media-images.json'),
    'utf-8',
  );
  const data = JSON.parse(jsonContent, (key, value) => {
    if (typeof value === 'string' && value.includes('...(line too long; chars omitted)')) {
      return value.replace('...(line too long; chars omitted)', '');
    }
    return value;
  });

  if (!isTypeDocData(data)) {
    throw new Error('Invalid TypeDoc data format');
  }

  const { name, readme, children, categories } = data;

  // Frontmatter
  const frontmatter = `---
kind: "api"
title: "${name}"
publishedAt: "${new Date().toISOString().split('T')[0]}"
summary: TODO!
groupHeading: "${categories.map(c => c.title).join(', ')}"
---

`;

  let mdxContent = frontmatter;

  // Add README content
  mdxContent += readme
    ? readme
        .map(({ kind, text }, index) => {
          // Skip the initial H1 heading
          if (index === 0 && kind === 'text' && text.startsWith('# ')) {
            return '';
          }
          // Convert other H1 headings to H2
          if (kind === 'text' && text.startsWith('# ')) {
            return `## ${text.slice(2)}`;
          }
          // Skip any other text that matches the package name
          if (kind === 'text' && text.trim() === name) {
            return '';
          }
          return kind === 'text' ? text : `\`${text}\``;
        })
        .join('')
        .trim() + '\n\n'
    : '';

  // Add categories and functions
  for (const category of categories) {
    mdxContent += `## ${category.title}\n\n`;
    for (const childId of category.children) {
      const child = children.find(c => c.id === childId);
      if (child) {
        if (child.kind === 64) { // Function declaration
          mdxContent += `<File name="${child.name}">\n\n\`\`\`typescript\n`;
          mdxContent += `${child.name}(`;
          
          // Render parameters
          mdxContent += child.signatures?.[0]?.parameters.map(param => `\n     ${param.name}: ${renderType(param.type)}`).join(',') || '';
          
          mdxContent += `)\n`;
          
          // Render return type
          if (child.signatures?.[0]?.type) {
            mdxContent += `     : ${renderType(child.signatures[0].type)}\n`;
          }
          
          mdxContent += '\`\`\`\n\n</File>\n\n';
        }
      }
    }
    mdxContent += '\n';
  }

  // Write the MDX content to a file
  await writeFile(outputFilePath, mdxContent.trim());

  return mdxContent;
}

function renderType(type: any): string {
  if (typeof type === 'object' && type !== null) {
    if (type.type === 'union') {
      return type.types.map(renderType).join(' | ');
    } else if (type.type === 'reference') {
      return `${type.name}${type.typeArguments ? `<${type.typeArguments.map(renderType).join(', ')}>` : ''}`;
    } else if (type.type === 'reflection') {
      return `{ ${type.declaration.children.map((child: { name: any; flags: { isOptional: any; }; type: any; }) => `${child.name}${child.flags.isOptional ? '?' : ''}: ${renderType(child.type)}`).join(', ')} }`;
    } else if (type.type === 'literal') {
      return type.value.toString();
    }
  }
  return '';
}

const outputFilePath = path.join('src/app/docs/api/(content)/jazz-browser-media-images.mdx');
createMdxContent(outputFilePath);