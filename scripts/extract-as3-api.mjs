import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const sourceRoot = process.argv[2];
const outputFormat = process.argv.includes('--json') ? 'json' : 'markdown';

if (sourceRoot === undefined) {
  console.error(
    'Usage: node scripts/extract-as3-api.mjs <org/flixel path> [--json]',
  );
  process.exitCode = 1;
} else {
  const files = await collectActionScriptFiles(sourceRoot);
  const classes = [];
  let sourceLineCount = 0;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    sourceLineCount += source.split(/\r?\n/u).length - 1;
    classes.push(parseClass(source, relative(sourceRoot, file)));
  }

  const manifest = {
    classCount: classes.length,
    classes,
    sourceLineCount,
  };

  if (outputFormat === 'json') {
    console.log(JSON.stringify(manifest, null, 2));
  } else {
    console.log(renderMarkdown(manifest));
  }
}

async function collectActionScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectActionScriptFiles(path)));
    } else if (entry.isFile() && extname(entry.name) === '.as') {
      files.push(path);
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function parseClass(source, file) {
  const packageName = source.match(/package\s+([\w.]+)/u)?.[1] ?? '';
  const code = source
    .replace(/\/\*[\s\S]*?\*\//gu, '')
    .replace(/\/\/.*$/gmu, '');
  const declaration = code.match(
    /public\s+(?:final\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?/u,
  );

  if (declaration?.[1] === undefined) {
    throw new Error(`Unable to find a public class declaration in ${file}`);
  }

  const members = new Map();
  const memberPattern =
    /\b(?:(static)\s+)?(?:override\s+)?public\s+(?:(static)\s+)?(?:(?:function\s+(?:(get|set)\s+)?(\w+))|(?:(var|const)\s+(\w+)))/gu;

  for (const match of code.matchAll(memberPattern)) {
    const isStatic = match[1] !== undefined || match[2] !== undefined;
    const accessor = match[3];
    const functionName = match[4];
    const fieldKind = match[5];
    const fieldName = match[6];
    const name = functionName ?? fieldName;

    if (name === undefined) {
      continue;
    }

    const existing = members.get(name);

    if (accessor !== undefined) {
      const accessors = new Set(existing?.accessors ?? []);
      accessors.add(accessor);
      members.set(name, {
        accessors: [...accessors].sort(),
        kind: 'accessor',
        name,
        static: isStatic,
      });
    } else {
      members.set(name, {
        kind: fieldKind ?? (name === declaration[1] ? 'constructor' : 'method'),
        name,
        static: isStatic,
      });
    }
  }

  return {
    extends: declaration[2] ?? null,
    file,
    members: [...members.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    name: declaration[1],
    package: packageName,
  };
}

function renderMarkdown(manifest) {
  const lines = [];

  for (const entry of manifest.classes) {
    const qualifiedName = `${entry.package}.${entry.name}`;
    const inheritance =
      entry.extends === null ? '' : ` extends \`${entry.extends}\``;
    const members = entry.members.map(formatMember).join(', ');
    lines.push(`### \`${qualifiedName}\`${inheritance}`);
    lines.push('');
    lines.push(`- Source: \`${entry.file}\``);
    lines.push(
      `- Public API (${entry.members.length}): ${members || '_none_'}`,
    );
    lines.push(
      '- Compatibility status: inventoried; implementation is tracked in the roadmap.',
    );
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}

function formatMember(member) {
  const staticPrefix = member.static ? 'static ' : '';
  const accessorSuffix =
    member.kind === 'accessor' ? ` (${member.accessors.join('/')})` : '';
  return `\`${staticPrefix}${member.name}${accessorSuffix}\``;
}
