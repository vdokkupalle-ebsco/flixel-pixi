import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ApiModel,
  ApiItemKind,
  ReleaseTag,
} from '@microsoft/api-extractor-model';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const apiJsonPath = join(rootDir, 'temp/flixel-pixi.api.json');
const docsApiDir = join(rootDir, 'docs/api');

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function renderDocNode(node) {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  switch (node.kind) {
    case 'PlainText':
      return node.text || '';
    case 'CodeSpan':
      return `\`${node.code}\``;
    case 'LinkTag': {
      const label = node.linkText || node.urlDestination || 'link';
      const url = node.urlDestination || '#';
      return `[${label}](${url})`;
    }
    case 'FencedCode':
      return `\n\`\`\`${node.language || 'ts'}\n${node.code}\n\`\`\`\n`;
    case 'Paragraph':
      return `${(node.nodes || []).map(renderDocNode).join('')}\n\n`;
    case 'Section':
      return (node.nodes || []).map(renderDocNode).join('');
    default:
      if (node.nodes) {
        return node.nodes.map(renderDocNode).join('');
      }
      return '';
  }
}

function renderDocSection(section) {
  if (!section) return '';
  return renderDocNode(section).trim();
}

function escapeTablePipe(str) {
  if (!str) return '';
  return str.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function cleanExcerpt(excerpt) {
  if (!excerpt) return '';
  if (typeof excerpt === 'string') {
    return excerpt.replace(/\s+/g, ' ').replace(/;\s*$/, '').trim();
  }
  if (typeof excerpt.text === 'string') {
    return excerpt.text.replace(/\s+/g, ' ').replace(/;\s*$/, '').trim();
  }
  if (Array.isArray(excerpt.excerptTokens)) {
    return excerpt.excerptTokens
      .map((t) => t.text || '')
      .join('')
      .replace(/\s+/g, ' ')
      .replace(/;\s*$/, '')
      .trim();
  }
  if (typeof excerpt.name === 'string') {
    return excerpt.name;
  }
  if (typeof excerpt.displayName === 'string') {
    return excerpt.displayName;
  }
  return '';
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
}

const CATEGORY_MAP = [
  {
    name: 'Core & Lifecycle',
    slug: 'core',
    description:
      'Game container, states, loop execution, context, and basic entities.',
    patterns: [
      /^FlxGame$/,
      /^FlxState$/,
      /^FlxSubState$/,
      /^FlxBasic$/,
      /^FlxContext$/,
      /^FlxSignal$/,
      /^FixedStepAccumulator/,
      /^FlxContainer$/,
      /^FLX_/,
      /^libraryName$/,
      /^upstreamBaseline$/,
      /^UpstreamBaseline$/,
    ],
  },
  {
    name: 'Game Objects & Sprites',
    slug: 'objects',
    description: 'Visual entities, sprites, groups, graphics, and emitters.',
    patterns: [
      /^FlxObject/,
      /^FlxSprite/,
      /^FlxSpriteGroup/,
      /^FlxSpriteContainer/,
      /^FlxBackdrop/,
      /^FlxStrip/,
      /^FlxGraphics/,
      /^FlxGradient/,
      /^FlxParticle/,
      /^FlxEmitter/,
      /^FlxTileblock/,
    ],
  },
  {
    name: 'Animation & Atlases',
    slug: 'animation',
    description: 'Texture atlases, frame animations, and sprite controllers.',
    patterns: [
      /^FlxAnimation/,
      /^FlxAnim/,
      /^FlxAtlas/,
      /^FlxFrame/,
      /^FlxFramesCollection/,
    ],
  },
  {
    name: 'Input & Controls',
    slug: 'input',
    description:
      'Keyboard, mouse, touch gestures, gamepads, virtual pads, and actions.',
    patterns: [
      /^Keyboard/,
      /^Mouse/,
      /^Input/,
      /^FlxTouch/,
      /^FlxGamepad/,
      /^FlxVirtual/,
      /^FlxActions/,
      /^FlxKeyRecord/,
      /^FlxMouseRecord/,
      /^FlxSwipe/,
      /^FlxInput/,
    ],
  },
  {
    name: 'Collision & Math',
    slug: 'collision-math',
    description:
      'Spatial quadtree, collision separation, vectors, rects, and RNG.',
    patterns: [
      /^FlxQuadTree/,
      /^FlxPoint/,
      /^FlxRect/,
      /^FlxU$/,
      /^FlxRandom/,
      /^clamp/,
      /^PointLike/,
      /^RectangleLike/,
      /^nextFlixelSeed/,
    ],
  },
  {
    name: 'Audio System',
    slug: 'audio',
    description:
      'WebAudio backend, spatial audio, sound groups, and volume control.',
    patterns: [/^FlxAudio/, /^FlxSound/, /^WebAudio/, /^NullAudio/],
  },
  {
    name: 'Tweens & Motion',
    slug: 'tweens',
    description:
      'Interpolation, easing formulas, motion curves, and tween management.',
    patterns: [
      /^FlxTween/,
      /^FlxEase/,
      /^FlxMotion/,
      /^FlxPath/,
      /^FlxAngleTween/,
      /^FlxColorTween/,
      /^FlxFlickerTween/,
      /^FlxShakeTween/,
      /^FlxCircularMotion/,
      /^FlxCubicMotion/,
      /^FlxLinearMotion/,
      /^FlxLinearPath/,
      /^FlxQuadMotion/,
      /^FlxQuadPath/,
      /^FlxNumTween/,
      /^FlxVarTween/,
    ],
  },
  {
    name: 'UI & Typography',
    slug: 'ui',
    description:
      'Buttons, 9-slice sprites, progress bars, and high-performance text.',
    patterns: [
      /^FlxButton/,
      /^FlxNineSlice/,
      /^FlxBar/,
      /^FlxText/,
      /^FlxInputText/,
      /^FlxBitmapText/,
      /^FlxBitmapFont/,
      /^parseBmFontXml/,
      /^FlxBmFontData/,
    ],
  },
  {
    name: 'Tilemaps',
    slug: 'tilemaps',
    description: '2D grid rendering, collision indexing, and map buffers.',
    patterns: [/^FlxTilemap/, /^FlxTile/],
  },
  {
    name: 'Assets & Loading',
    slug: 'assets-loading',
    description:
      'Asset bundles, asynchronous loading sessions, and graphics cache.',
    patterns: [
      /^FlxAssets/,
      /^FlxAsset/,
      /^FlxGraphic/,
      /^FlxLoading/,
      /^throwIfAborted/,
    ],
  },
  {
    name: 'Browser DX & Viewport',
    slug: 'browser-dx',
    description:
      'Browser application bootstrap, auto-scaling viewports, and safe areas.',
    patterns: [
      /^createBrowserGame/,
      /^BrowserGame/,
      /^FlxBrowser/,
      /^FlxAudioControls/,
    ],
  },
  {
    name: 'Debugger & Diagnostics',
    slug: 'debugger',
    description:
      'Interactive console, variable watch, FPS meter, and object inspector.',
    patterns: [
      /^FlxDebugger/,
      /^FlxConsole/,
      /^FlxWatch/,
      /^FlxDiagnostics/,
      /^FlxFpsDisplay/,
      /^FlxPreloader/,
      /^FlxLog/,
      /^FlxObjectInspector/,
      /^DebugChannel/,
      /^DebugPathDisplay/,
      /^TimerManager/,
      /^LogEntry/,
      /^WatchEntry/,
      /^WatchSnapshot/,
      /^PreloaderState/,
    ],
  },
  {
    name: 'Storage & Replay',
    slug: 'storage-replay',
    description:
      'Persistent save data, deterministic recording, and AS3 replay compatibility.',
    patterns: [
      /^FlxSave/,
      /^LocalStorage/,
      /^IndexedDB/,
      /^NullStorage/,
      /^FlxStorage/,
      /^FlxReplay/,
      /^FrameRecord/,
      /^MouseRecord/,
      /^convertAS3/,
      /^convertFlxReplay/,
      /^CodePair/,
      /^FlxVCR/,
    ],
  },
  {
    name: 'Rendering & Filters',
    slug: 'rendering-filters',
    description:
      'PixiJS render handles, post-processing filters, shaders, and camera views.',
    patterns: [
      /^FlxBlurFilter/,
      /^FlxColorMatrixFilter/,
      /^FlxDisplacementFilter/,
      /^FlxShaderFilter/,
      /^FlxShaderUniform/,
      /^FlxCamera/,
      /^FlxFilter/,
      /^FlxRenderHandle/,
      /^FlxRenderable/,
      /^collectRenderables/,
      /^syncWorldToRenderer/,
      /^makeGraphicPixels/,
      /^PixelBuffer/,
      /RenderHandle$/,
    ],
  },
];

function assignCategory(name) {
  for (const cat of CATEGORY_MAP) {
    for (const pat of cat.patterns) {
      if (pat.test(name)) {
        return cat;
      }
    }
  }
  return {
    name: 'Other Declarations',
    slug: 'other',
    description: 'Types, options, interfaces, and utilities.',
  };
}

function renderApiItemPage(item, category) {
  const name = item.displayName;
  const kind = item.kind;
  let md = '';

  md += `---
title: ${name} (${kind})
description: API reference documentation for ${name} in Flixel-Pixi.
editLink: false
---

<div class="api-header">
  <span class="api-badge kind-${kind.toLowerCase()}">${kind}</span>
  <span class="api-badge category">${category.name}</span>
  <span class="api-badge public">@public</span>
</div>

# ${name}

`;

  // Summary
  if (item.tsdocComment?.summarySection) {
    const summary = renderDocSection(item.tsdocComment.summarySection);
    if (summary) {
      md += `${summary}\n\n`;
    }
  }

  // Type signature / Excerpt
  if (item.excerpt) {
    const code = cleanExcerpt(item.excerpt);
    if (code) {
      md += `\`\`\`ts\n${code}\n\`\`\`\n\n`;
    }
  }

  // Class / Interface inheritance
  if (item.extendsType) {
    const ext = cleanExcerpt(item.extendsType);
    if (ext) md += `**Extends:** \`${ext}\`\n\n`;
  } else if (item.extendsTypes && item.extendsTypes.length > 0) {
    const exts = item.extendsTypes
      .map((t) => cleanExcerpt(t))
      .filter(Boolean)
      .map((t) => `\`${t}\``);
    if (exts.length > 0) md += `**Extends:** ${exts.join(', ')}\n\n`;
  }
  if (item.implementsTypes && item.implementsTypes.length > 0) {
    const imps = item.implementsTypes
      .map((t) => cleanExcerpt(t))
      .filter(Boolean)
      .map((t) => `\`${t}\``);
    if (imps.length > 0) md += `**Implements:** ${imps.join(', ')}\n\n`;
  }

  // Remarks
  if (item.tsdocComment?.remarksBlock) {
    const remarks = renderDocSection(item.tsdocComment.remarksBlock.content);
    if (remarks) {
      md += `## Remarks\n\n${remarks}\n\n`;
    }
  }

  // Examples
  if (item.tsdocComment?.customBlocks) {
    for (const block of item.tsdocComment.customBlocks) {
      if (block.blockTag?.tagName === '@example') {
        const example = renderDocSection(block.content);
        if (example) {
          md += `## Example\n\n${example}\n\n`;
        }
      }
    }
  }

  // Class Members
  if (item.kind === ApiItemKind.Class || item.kind === ApiItemKind.Interface) {
    const constructors = [];
    const properties = [];
    const methods = [];

    for (const member of item.members || []) {
      if (
        member.kind === ApiItemKind.Constructor ||
        member.kind === ApiItemKind.ConstructSignature
      ) {
        constructors.push(member);
      } else if (
        member.kind === ApiItemKind.Property ||
        member.kind === ApiItemKind.PropertySignature
      ) {
        properties.push(member);
      } else if (
        member.kind === ApiItemKind.Method ||
        member.kind === ApiItemKind.MethodSignature
      ) {
        methods.push(member);
      }
    }

    // Constructors
    if (constructors.length > 0) {
      md += `## Constructors\n\n`;
      for (const ctor of constructors) {
        const sig = cleanExcerpt(ctor.excerpt);
        md += `\`\`\`ts\n${sig}\n\`\`\`\n\n`;
        if (ctor.tsdocComment?.summarySection) {
          md += `${renderDocSection(ctor.tsdocComment.summarySection)}\n\n`;
        }

        if (ctor.parameters && ctor.parameters.length > 0) {
          md += `| Parameter | Type | Description |\n`;
          md += `| :--- | :--- | :--- |\n`;
          for (const param of ctor.parameters) {
            const pName = param.name;
            const pType = escapeTablePipe(
              cleanExcerpt(param.parameterTypeExcerpt),
            );
            const pDoc = escapeTablePipe(
              param.tsdocParamBlock
                ? renderDocSection(param.tsdocParamBlock.content)
                : '',
            );
            md += `| \`${pName}\` | \`${pType}\` | ${pDoc || '-'} |\n`;
          }
          md += `\n`;
        }
      }
    }

    // Properties
    if (properties.length > 0) {
      md += `## Properties\n\n`;
      md += `| Property | Modifiers | Type | Description |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      for (const prop of properties) {
        const pName = prop.displayName;
        const isStatic = prop.isStatic ? '`static` ' : '';
        const isReadonly = prop.isReadonly ? '`readonly` ' : '';
        const mods = `${isStatic}${isReadonly}`.trim() || '-';
        const pType = escapeTablePipe(cleanExcerpt(prop.propertyTypeExcerpt));
        const pDoc = escapeTablePipe(
          prop.tsdocComment?.summarySection
            ? renderDocSection(prop.tsdocComment.summarySection)
            : '',
        );
        md += `| **\`${pName}\`** | ${mods} | \`${pType}\` | ${pDoc || '-'} |\n`;
      }
      md += `\n`;
    }

    // Methods
    if (methods.length > 0) {
      md += `## Methods\n\n`;
      for (const method of methods) {
        const mName = method.displayName;
        const isStatic = method.isStatic ? '`static` ' : '';
        const retType = cleanExcerpt(method.returnTypeExcerpt) || 'void';
        md += `### ${isStatic}\`${mName}()\`\n\n`;

        const mSig = cleanExcerpt(method.excerpt);
        if (mSig) {
          md += `\`\`\`ts\n${mSig}\n\`\`\`\n\n`;
        }

        if (method.tsdocComment?.summarySection) {
          md += `${renderDocSection(method.tsdocComment.summarySection)}\n\n`;
        }

        if (method.parameters && method.parameters.length > 0) {
          md += `**Parameters:**\n\n`;
          md += `| Parameter | Type | Description |\n`;
          md += `| :--- | :--- | :--- |\n`;
          for (const param of method.parameters) {
            const pName = param.name;
            const pType = escapeTablePipe(
              cleanExcerpt(param.parameterTypeExcerpt),
            );
            const pDoc = escapeTablePipe(
              param.tsdocParamBlock
                ? renderDocSection(param.tsdocParamBlock.content)
                : '',
            );
            md += `| \`${pName}\` | \`${pType}\` | ${pDoc || '-'} |\n`;
          }
          md += `\n`;
        }

        md += `**Returns:** \`${retType}\`\n\n`;

        if (method.tsdocComment?.returnsBlock) {
          const retDoc = renderDocSection(
            method.tsdocComment.returnsBlock.content,
          );
          if (retDoc) {
            md += `> ${retDoc}\n\n`;
          }
        }

        // Example for method
        if (method.tsdocComment?.customBlocks) {
          for (const block of method.tsdocComment.customBlocks) {
            if (block.blockTag?.tagName === '@example') {
              const ex = renderDocSection(block.content);
              if (ex) {
                md += `**Example:**\n\n${ex}\n\n`;
              }
            }
          }
        }
      }
    }
  }

  // Function parameters & returns
  if (item.kind === ApiItemKind.Function) {
    if (item.parameters && item.parameters.length > 0) {
      md += `## Parameters\n\n`;
      md += `| Parameter | Type | Description |\n`;
      md += `| :--- | :--- | :--- |\n`;
      for (const param of item.parameters) {
        const pName = param.name;
        const pType = escapeTablePipe(cleanExcerpt(param.parameterTypeExcerpt));
        const pDoc = escapeTablePipe(
          param.tsdocParamBlock
            ? renderDocSection(param.tsdocParamBlock.content)
            : '',
        );
        md += `| \`${pName}\` | \`${pType}\` | ${pDoc || '-'} |\n`;
      }
      md += `\n`;
    }

    const retType = cleanExcerpt(item.returnTypeExcerpt) || 'void';
    md += `## Returns\n\n\`${retType}\`\n\n`;
    if (item.tsdocComment?.returnsBlock) {
      const retDoc = renderDocSection(item.tsdocComment.returnsBlock.content);
      if (retDoc) {
        md += `${retDoc}\n\n`;
      }
    }
  }

  return md;
}

function generate() {
  console.log('Generating API documentation from API Extractor model...');
  if (!existsSync(apiJsonPath)) {
    throw new Error(
      `API model not found at ${apiJsonPath}. Run 'npm run api:check' first.`,
    );
  }

  const model = new ApiModel();
  const pkg = model.loadPackage(apiJsonPath);
  const entry = pkg.entryPoints[0];

  ensureDir(docsApiDir);

  const categoriesWithItems = new Map();
  for (const cat of CATEGORY_MAP) {
    categoriesWithItems.set(cat.slug, { ...cat, items: [] });
  }
  const otherCat = {
    name: 'Types & Utilities',
    slug: 'other',
    description: 'Data types, helper interfaces, and utility declarations.',
    items: [],
  };
  categoriesWithItems.set('other', otherCat);

  const itemsByName = new Map();

  for (const member of entry.members) {
    // Only public APIs
    if (
      member.releaseTag === ReleaseTag.Internal ||
      member.releaseTag === ReleaseTag.Alpha
    ) {
      continue;
    }

    const cat = assignCategory(member.displayName);
    const catBucket = categoriesWithItems.get(cat.slug) || otherCat;
    catBucket.items.push(member);
    itemsByName.set(member.displayName, member);

    const fileName = `${slugify(member.displayName)}.md`;
    const filePath = join(docsApiDir, fileName);
    const content = renderApiItemPage(member, catBucket);
    writeFileSync(filePath, content, 'utf8');
  }

  // Generate docs/api/index.md
  let indexMd = `---
title: API Reference
description: Complete public API reference for Flixel-Pixi game engine.
editLink: false
---

# API Reference

Complete reference for all classes, functions, interfaces, and types exported by \`flixel-pixi\`.

`;

  const sidebarGroups = [];

  for (const [, cat] of categoriesWithItems.entries()) {
    if (cat.items.length === 0) continue;

    cat.items.sort((a, b) => a.displayName.localeCompare(b.displayName));

    indexMd += `## ${cat.name}\n\n`;
    indexMd += `${cat.description}\n\n`;
    indexMd += `| Symbol | Kind | Description |\n`;
    indexMd += `| :--- | :--- | :--- |\n`;

    const sidebarItems = [];

    for (const item of cat.items) {
      const itemSlug = slugify(item.displayName);
      const summary = item.tsdocComment?.summarySection
        ? escapeTablePipe(renderDocSection(item.tsdocComment.summarySection))
        : '-';
      indexMd += `| [**\`${item.displayName}\`**](./${itemSlug}.md) | \`${item.kind}\` | ${summary} |\n`;

      sidebarItems.push({
        text: item.displayName,
        link: `/api/${itemSlug}`,
      });
    }

    indexMd += `\n`;

    sidebarGroups.push({
      text: cat.name,
      collapsed: false,
      items: sidebarItems,
    });
  }

  writeFileSync(join(docsApiDir, 'index.md'), indexMd, 'utf8');

  // Save generated sidebar metadata for VitePress config
  const metadataDir = join(rootDir, 'docs/.vitepress');
  ensureDir(metadataDir);
  writeFileSync(
    join(metadataDir, 'api-sidebar.json'),
    JSON.stringify(sidebarGroups, null, 2),
    'utf8',
  );

  console.log(
    `Successfully generated ${entry.members.length} API reference documents in docs/api/!`,
  );
}

generate();
