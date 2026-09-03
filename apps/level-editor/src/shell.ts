import {
  parseParticleEffect,
  serializeProjectDocument,
  type AssetDefinition,
  type EntityDefinition,
} from '@flixel-pixi/schemas';
import {
  createProtocolPeer,
  EDITOR_PROTOCOL_VERSION,
  type ProtocolPeer,
} from '@flixel-pixi/editor-protocol';

import type { LevelEditorStatus, LevelEditorStore } from './editor-store';
import { icon } from './icons';
import { isTileTool } from './tiles';
import { mountTilePalette, tileContext } from './tile-palette';
import { getEditorExtension } from './model';
import {
  activeScene,
  activeSceneSettings,
  createId,
  createSpriteEntity,
  entityProperties,
  parseLevelProject,
  type EditorTool,
  type LevelEditorSnapshot,
  type SpriteProperties,
} from './model';
import {
  bodyForEntity,
  createBodyForEntity,
  createJoint,
  removeBody,
  updateBodyShape,
  type SupportedJointType,
} from './physics-authoring';
import { SceneViewport } from './viewport';
import { createWindowTransport } from './protocol-transport';
import {
  atlasFramesForAsset,
  atlasImageFileName,
  createAtlasAsset,
  parseAtlasFrames,
  type AtlasFrameItem,
} from './atlas-assets';
import {
  activeLayer,
  layerForEntity,
  sceneLayers,
  type LayerPurpose,
} from './model';

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function download(filename: string, contents: string, type: string): void {
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([contents], { type }));
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(anchor.href), 0);
}

function button(
  action: string,
  label: string,
  iconName: Parameters<typeof icon>[0],
  shortcut = '',
): string {
  return `<button class="icon-button" type="button" data-action="${action}" aria-label="${label}" title="${label}${shortcut === '' ? '' : ` (${shortcut})`}">${icon(iconName)}</button>`;
}

function selectedEntity(
  snapshot: LevelEditorSnapshot,
): EntityDefinition | undefined {
  const id = snapshot.selectedEntityIds.at(-1);
  return activeScene(snapshot).entities.find((entity) => entity.id === id);
}

function sortEntities(snapshot: LevelEditorSnapshot): EntityDefinition[] {
  return [...activeScene(snapshot).entities].sort(
    (a, b) =>
      layerForEntity(snapshot, b).order - layerForEntity(snapshot, a).order ||
      Number(entityProperties(b).zIndex ?? 0) -
        Number(entityProperties(a).zIndex ?? 0),
  );
}

const layerPurposes: readonly LayerPurpose[] = [
  'background',
  'gameplay',
  'collision',
  'foreground',
  'ui',
];

function readImageDimensions(
  src: string,
): Promise<{ height: number; width: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener(
      'load',
      () => resolve({ height: image.naturalHeight, width: image.naturalWidth }),
      { once: true },
    );
    image.addEventListener(
      'error',
      () => reject(new Error('The image could not be decoded.')),
      {
        once: true,
      },
    );
    image.src = src;
  });
}

function readFileDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result)), {
      once: true,
    });
    reader.addEventListener(
      'error',
      () => reject(reader.error ?? new Error('Read failed.')),
      { once: true },
    );
    reader.readAsDataURL(file);
  });
}

function assetIdFromFileName(fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, '');
  const normalized = stem
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || createId('image');
}

function uniqueAssetId(
  snapshot: LevelEditorSnapshot,
  requested: string,
): string {
  const ids = new Set(snapshot.document.assets.map((asset) => asset.id));
  if (!ids.has(requested)) return requested;
  let suffix = 2;
  while (ids.has(`${requested}-${String(suffix)}`)) suffix += 1;
  return `${requested}-${String(suffix)}`;
}

function particleEffectUsesAsset(
  snapshot: LevelEditorSnapshot,
  assetId: string,
): boolean {
  return snapshot.document.assets.some((asset) => {
    if (asset.kind !== 'data' || !asset.src.startsWith('data:')) return false;
    const comma = asset.src.indexOf(',');
    if (comma < 0) return false;
    try {
      const effect = parseParticleEffect(
        JSON.parse(decodeURIComponent(asset.src.slice(comma + 1))),
      );
      return effect.emitters.some(
        (emitter) => emitter.preset.appearance.texture.assetId === assetId,
      );
    } catch {
      return false;
    }
  });
}

export function mountEditor(
  host: HTMLElement,
  store: LevelEditorStore,
): () => void {
  const previewSession = crypto.randomUUID();
  host.innerHTML = `
    <main class="editor-app" aria-label="Flixel-Pixi Level Editor">
      <header class="topbar">
        <a class="brand" href="https://github.com/vdokkupalle-ebsco/flixel-pixi" target="_blank" rel="noreferrer" aria-label="Flixel-Pixi repository (opens in a new tab)">
          <span class="brand-mark" aria-hidden="true"><i></i><i></i></span>
          <span><strong>Flixel-Pixi</strong><small>Level Editor</small></span>
        </a>
        <label class="project-name"><span class="sr-only">Project name</span><input data-field="project-name" value="Untitled game" /></label>
        <nav class="top-actions" aria-label="Project actions">
          ${button('undo', 'Undo', 'undo', '⌘Z')}
          ${button('redo', 'Redo', 'redo', '⇧⌘Z')}
          ${button('duplicate', 'Duplicate selection', 'duplicate', '⌘D')}
          <span class="toolbar-separator"></span>
          <button class="button ghost" type="button" data-action="import">${icon('assets')} Import</button>
          <button class="button ghost" type="button" data-action="export">${icon('export')} Export</button>
          <button class="button primary" type="button" data-action="preview">${icon('play')} Preview</button>
        </nav>
      </header>
      <div class="workspace">
        <aside class="left-panel panel" aria-label="Scene and assets">
          <div class="panel-tabs" role="tablist" aria-label="Left panel">
            <button role="tab" aria-selected="true" data-panel-tab="scene">Scene</button>
            <button role="tab" aria-selected="false" data-panel-tab="assets">Assets</button>
          </div>
          <section class="panel-view" data-panel="scene" aria-label="Scene hierarchy">
            <div class="panel-heading"><div><small>Hierarchy</small><strong data-scene-name>Main scene</strong></div><div class="heading-actions"><button class="small-icon" type="button" data-action="add-layer" aria-label="Add layer" title="Add layer">${icon('layers')}</button><button class="small-icon" type="button" data-action="add-sprite" aria-label="Add sprite">${icon('add')}</button></div></div>
            <div class="hierarchy" data-hierarchy role="tree" aria-label="Scene objects"></div>
          </section>
          <section class="panel-view" data-panel="assets" aria-label="Asset library" hidden>
            <div class="panel-heading"><div><small>Project</small><strong>Assets</strong></div><button class="small-icon" type="button" data-action="upload-asset" aria-label="Upload asset">${icon('add')}</button></div>
            <p class="panel-help">Upload images, Particle Editor effects, or select a spritesheet image and TextureAtlas XML together. Atlas frames become individual placeable items.</p>
            <div class="asset-grid" data-assets></div>
          </section>
        </aside>
        <section class="stage" aria-label="Scene workspace">
          <div class="toolrail" role="toolbar" aria-label="Transform tools">
            <button type="button" data-tool="select" aria-label="Select tool" aria-pressed="true">${icon('select')}<kbd>V</kbd></button>
            <button type="button" data-tool="pan" aria-label="Pan stage" aria-pressed="false">${icon('pan')}<kbd>H</kbd></button>
            <button type="button" data-tool="move" aria-label="Move tool" aria-pressed="false">${icon('move')}<kbd>G</kbd></button>
            <button type="button" data-tool="rotate" aria-label="Rotate tool" aria-pressed="false">${icon('rotate')}<kbd>R</kbd></button>
            <button type="button" data-tool="scale" aria-label="Scale tool" aria-pressed="false">${icon('zoomIn')}<kbd>S</kbd></button>
          </div>
          <div class="tile-toolstrip" role="toolbar" aria-label="Tile tools">
            <span class="toolstrip-label">Tiles</span>
            ${(
              [
                ['brush', 'Stamp brush', 'B'],
                ['eraser', 'Eraser', 'E'],
                ['fill', 'Bucket fill', 'F'],
                ['rectangle', 'Rectangle fill', 'P'],
                ['eyedropper', 'Pick tile', 'I'],
              ] as const
            )
              .map(
                ([tool, label, key]) =>
                  `<button type="button" data-tool="${tool}" aria-label="${label}" aria-pressed="false" title="${label} (${key})">${icon(tool)}<span>${label}</span><kbd>${key}</kbd></button>`,
              )
              .join('')}
          </div>
          <div class="tile-context" data-tile-context hidden></div>
          <div class="stage-toolbar" role="toolbar" aria-label="Canvas controls">
            <button class="toolbar-toggle" type="button" data-action="toggle-grid" aria-pressed="true">${icon('grid')} Snap <kbd>⌘'</kbd></button>
            <button class="toolbar-toggle" type="button" data-action="show-grid" aria-label="Show grid" aria-pressed="true" title="Show grid">${icon('grid')}</button>
            <span class="toolbar-separator"></span>
            ${button('zoom-out', 'Zoom out', 'zoomOut')}
            <output data-zoom aria-live="polite">100%</output>
            ${button('zoom-in', 'Zoom in', 'zoomIn')}
            <button class="text-button" type="button" data-action="zoom-fit">Fit</button>
          </div>
          <canvas id="editor-canvas" tabindex="0" aria-label="Scene canvas. B brush, E eraser, F fill, P rectangle, I pick tile. Right-drag captures a stamp. Escape cancels a stroke."></canvas>
          <div class="canvas-hint">Space + drag pans · wheel scrolls · ⌘/Ctrl + wheel zooms · ⌘/Ctrl + D duplicates</div>
        </section>
        <aside class="right-panel panel" aria-label="Inspector">
          <div class="panel-heading inspector-heading"><div><small>Properties</small><strong>Inspector</strong></div><button class="small-icon danger" type="button" data-action="delete" aria-label="Delete selected object">${icon('delete')}</button></div>
          <section class="tileset-dock" data-tilesets aria-label="Tilesets"></section>
          <div class="inspector" data-inspector></div>
        </aside>
      </div>
      <footer class="statusbar">
        <span class="status-dot" data-dirty aria-hidden="true"></span><span data-status role="status" aria-live="polite">Project ready</span>
        <span class="status-spacer"></span>
        <span data-tile-position></span><span data-tile-count>0 tiles</span><span>·</span><span data-count>0 objects</span><span>·</span><span data-scene-size>960 × 540</span>
        <a href="https://vdokkupalle-ebsco.github.io/flixel-pixi/" target="_blank" rel="noreferrer">Docs ↗</a>
      </footer>
      <input type="file" data-asset-input accept="image/png,image/jpeg,image/gif,image/webp,image/avif,image/svg+xml,application/json,.json,application/xml,text/xml,.xml" hidden multiple />
      <input type="file" data-project-input accept="application/json,.json" hidden />
      <div class="toast" data-toast role="status" aria-live="polite"></div>
      <dialog data-preview-dialog aria-labelledby="preview-title">
        <div class="dialog-heading"><div><small>Playable build</small><h2 id="preview-title">Scene preview</h2></div><div class="preview-actions"><button class="text-button" type="button" data-preview-command="pause">Pause</button><button class="text-button" type="button" data-preview-command="resume">Resume</button><button class="text-button" type="button" data-preview-command="reset">Reset</button><button class="small-icon" type="button" data-action="close-preview" aria-label="Close preview">${icon('close')}</button></div></div>
        <iframe data-preview-frame title="Playable Flixel-Pixi scene preview" data-src="./preview.html?session=${previewSession}"></iframe>
      </dialog>
    </main>`;

  const canvas = host.querySelector<HTMLCanvasElement>('#editor-canvas');
  if (canvas === null) throw new Error('Scene canvas is missing.');
  const viewport = new SceneViewport(canvas, store);
  const assetInput = host.querySelector<HTMLInputElement>('[data-asset-input]');
  const projectInput = host.querySelector<HTMLInputElement>(
    '[data-project-input]',
  );
  const toast = host.querySelector<HTMLElement>('[data-toast]');
  const previewFrame = host.querySelector<HTMLIFrameElement>(
    '[data-preview-frame]',
  );
  const previewDialog = host.querySelector<HTMLDialogElement>(
    '[data-preview-dialog]',
  );
  if (
    assetInput === null ||
    projectInput === null ||
    toast === null ||
    previewFrame === null ||
    previewDialog === null
  ) {
    throw new Error('Editor inputs are missing.');
  }
  const assetFileInput = assetInput;
  const projectFileInput = projectInput;
  const runtimeFrame = previewFrame;
  const runtimeDialog = previewDialog;
  let previewPeer: ProtocolPeer | undefined;
  let previewReady = false;
  let previewTimer = 0;
  let toastTimer = 0;

  const announce = (message: string, error = false): void => {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.toggle('error', error);
    toast.classList.add('visible');
    toastTimer = window.setTimeout(
      () => toast.classList.remove('visible'),
      3200,
    );
  };

  const sendProjectToPreview = (): void => {
    if (!previewReady || previewPeer === undefined) return;
    previewPeer.send('project.load', {
      revision: store.status.revision,
      serializedProject: serializeProjectDocument(
        store.status.snapshot.document,
      ),
    });
  };

  const openPreview = (): void => {
    if (previewPeer === undefined) {
      const target = runtimeFrame.contentWindow;
      if (target === null) throw new Error('Preview window is unavailable.');
      previewPeer = createProtocolPeer({
        createMessageId: () => crypto.randomUUID(),
        role: 'editor',
        sessionId: previewSession,
        transport: createWindowTransport(target, target),
      });
      previewPeer.onMessage((message) => {
        if (message.type === 'preview.ready') {
          previewReady = true;
          previewPeer?.send('editor.hello', {
            capabilities: ['project.load', 'preview.command', 'selection.set'],
            supportedProtocolVersions: [EDITOR_PROTOCOL_VERSION],
          });
          sendProjectToPreview();
        } else if (message.type === 'project.rejected') {
          announce(
            message.payload.diagnostics
              .map((diagnostic) => diagnostic.message)
              .join(' · '),
            true,
          );
        }
      });
      runtimeFrame.src = runtimeFrame.dataset.src ?? './preview.html';
    } else {
      sendProjectToPreview();
    }
    runtimeDialog.showModal();
  };

  function setTool(tool: EditorTool): void {
    store.update(
      `Selected ${tool} tool`,
      (draft) => {
        draft.tool = tool;
        if (isTileTool(tool)) {
          draft.selectedEntityIds = [];
          const settings = activeSceneSettings(draft);
          settings.layers ??= sceneLayers(draft).map((layer) => ({ ...layer }));
        }
      },
      false,
    );
  }

  function addSprite(assetId?: string, atlasFrame?: AtlasFrameItem): void {
    const snapshot = store.status.snapshot;
    const resolvedAssetId = assetId ?? snapshot.document.assets[0]?.id;
    if (resolvedAssetId === undefined) {
      announce('Upload an image asset first.', true);
      assetFileInput.click();
      return;
    }
    store.update('Added sprite', (draft) => {
      const scene = activeScene(draft);
      const entity = createSpriteEntity(
        resolvedAssetId,
        scene.entities.length + 1,
      );
      const asset = draft.document.assets.find(
        (candidate) => candidate.id === resolvedAssetId,
      );
      const width = Number(asset?.metadata?.width ?? 96);
      const height = Number(asset?.metadata?.height ?? 96);
      const maxSize = 160;
      const properties = entity.properties as SpriteProperties;
      const sourceWidth = atlasFrame?.width ?? width;
      const sourceHeight = atlasFrame?.height ?? height;
      const frameRatio = Math.min(
        1,
        maxSize / Math.max(sourceWidth, sourceHeight),
      );
      properties.width = Math.max(1, Math.round(sourceWidth * frameRatio));
      properties.height = Math.max(1, Math.round(sourceHeight * frameRatio));
      properties.layerId = activeLayer(draft).id;
      if (atlasFrame !== undefined) {
        entity.name = atlasFrame.name.replace(/\.[^.]+$/, '');
        properties.frameX = atlasFrame.x;
        properties.frameY = atlasFrame.y;
        properties.frameWidth = atlasFrame.width;
        properties.frameHeight = atlasFrame.height;
        properties.frameName = atlasFrame.name;
      }
      scene.entities.push(entity);
      draft.selectedEntityIds = [entity.id];
      draft.tool = 'select';
    });
    announce('Sprite added to the scene.');
  }

  function duplicateSelected(): void {
    const selectedIds = store.status.snapshot.selectedEntityIds;
    if (selectedIds.length === 0) return;
    store.update('Duplicated selection', (draft) => {
      const scene = activeScene(draft);
      const world = activeSceneSettings(draft).physics;
      const entityIds = new Map<string, string>();
      const bodyIds = new Map<string, string>();
      const offset = activeSceneSettings(draft).gridSize;
      const copies = scene.entities.flatMap((entity) => {
        if (!selectedIds.includes(entity.id)) return [];
        const copy = structuredClone(entity);
        const nextId = createId(
          entity.type === 'particle-effect' ? 'particle' : 'sprite',
        );
        entityIds.set(entity.id, nextId);
        copy.id = nextId;
        copy.name = `${entity.name ?? entity.id} copy`;
        copy.position.x += offset;
        copy.position.y += offset;
        return [copy];
      });
      for (const body of [...world.bodies]) {
        const entityId = entityIds.get(body.entityId);
        if (entityId === undefined) continue;
        const copy = structuredClone(body);
        const nextId = createId('body');
        bodyIds.set(body.id, nextId);
        copy.id = nextId;
        copy.entityId = entityId;
        world.bodies.push(copy);
      }
      for (const joint of [...(world.joints ?? [])]) {
        const bodyA = bodyIds.get(joint.bodyA);
        const bodyB = bodyIds.get(joint.bodyB);
        if (bodyA === undefined || bodyB === undefined) continue;
        const copy = structuredClone(joint);
        copy.id = createId('joint');
        copy.bodyA = bodyA;
        copy.bodyB = bodyB;
        (world.joints ??= []).push(copy);
      }
      scene.entities.push(...copies);
      draft.selectedEntityIds = copies.map((entity) => entity.id);
    });
    announce(
      `${selectedIds.length} object${selectedIds.length === 1 ? '' : 's'} duplicated.`,
    );
  }

  function deleteSelected(): void {
    const count = store.status.snapshot.selectedEntityIds.length;
    if (count === 0) return;
    store.update('Deleted selection', (draft) => {
      const selected = new Set(draft.selectedEntityIds);
      const scene = activeScene(draft);
      const world = activeSceneSettings(draft).physics;
      for (const body of [...world.bodies]) {
        if (selected.has(body.entityId)) removeBody(world, body.id);
      }
      scene.entities = scene.entities.filter(
        (entity) => !selected.has(entity.id),
      );
      draft.selectedEntityIds = [];
    });
    announce(`${count} object${count === 1 ? '' : 's'} deleted.`);
  }

  function reorder(entityId: string, direction: -1 | 1): void {
    store.update(
      direction > 0 ? 'Moved object forward' : 'Moved object backward',
      (draft) => {
        const entities = activeScene(draft).entities;
        const entity = entities.find((candidate) => candidate.id === entityId);
        if (entity === undefined) return;
        const properties = entityProperties(entity);
        properties.zIndex = Number(properties.zIndex ?? 0) + direction;
      },
    );
  }

  function addLayer(): void {
    store.update('Added layer', (draft) => {
      const settings = activeSceneSettings(draft);
      const layers = (settings.layers ??= [...sceneLayers(draft)]);
      const layer = {
        id: createId('layer'),
        locked: false,
        name: `Layer ${layers.length + 1}`,
        order:
          Math.max(-100, ...layers.map((candidate) => candidate.order)) + 100,
        purpose: 'gameplay' as const,
        visible: true,
      };
      layers.push(layer);
      settings.activeLayerId = layer.id;
    });
    announce('Layer added and selected for new objects.');
  }

  async function importAssets(files: FileList): Promise<void> {
    const selectedFiles = [...files];
    const xmlFiles = selectedFiles.filter((file) => /\.xml$/i.test(file.name));
    const imageFiles = selectedFiles.filter(
      (file) =>
        file.type.startsWith('image/') ||
        /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file.name),
    );
    const atlasImages = new Set<File>();

    for (const xmlFile of xmlFiles) {
      try {
        const xmlText = await xmlFile.text();
        const requestedImageName = atlasImageFileName(xmlText)?.toLowerCase();
        const imageFile = imageFiles.find(
          (candidate) =>
            !atlasImages.has(candidate) &&
            (candidate.name.toLowerCase() === requestedImageName ||
              imageFiles.length === 1),
        );
        if (imageFile === undefined) {
          throw new Error(
            `${xmlFile.name} needs its spritesheet image selected in the same upload.`,
          );
        }
        // Once an XML file claims an image, never fall back to importing that
        // image as a full-size asset if parsing fails. That fallback hides the
        // real atlas error and makes a broken import look successful.
        atlasImages.add(imageFile);
        const src = await readFileDataUrl(imageFile);
        const dimensions = await readImageDimensions(src);
        const frames = parseAtlasFrames(
          xmlText,
          dimensions.width,
          dimensions.height,
        );
        const requestedId = assetIdFromFileName(imageFile.name);
        const asset = createAtlasAsset(
          uniqueAssetId(store.status.snapshot, requestedId),
          imageFile.name,
          xmlFile.name,
          src,
          dimensions.width,
          dimensions.height,
          frames,
        );
        store.update('Imported spritesheet atlas', (draft) => {
          draft.document.assets.push(asset);
        });
        announce(`${frames.length} frames imported from ${xmlFile.name}.`);
      } catch (error) {
        announce(error instanceof Error ? error.message : String(error), true);
      }
    }

    for (const file of selectedFiles) {
      if (xmlFiles.includes(file) || atlasImages.has(file)) continue;
      try {
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const raw = parseParticleEffect(JSON.parse(await file.text()));
          const src = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(raw))}`;
          const asset: AssetDefinition = {
            id: createId('particle'),
            kind: 'data',
            metadata: {
              effectName: String(raw.name ?? file.name),
              fileName: file.name,
            },
            src,
          };
          store.update('Imported particle effect', (draft) => {
            draft.document.assets.push(asset);
          });
        } else {
          const src = await readFileDataUrl(file);
          const dimensions = await readImageDimensions(src);
          const requestedId = assetIdFromFileName(file.name);
          const asset: AssetDefinition = {
            id: uniqueAssetId(store.status.snapshot, requestedId),
            kind: 'image',
            metadata: { ...dimensions, fileName: file.name },
            src,
          };
          store.update('Imported image asset', (draft) => {
            draft.document.assets.push(asset);
          });
        }
        announce(`${file.name} imported.`);
      } catch (error) {
        announce(error instanceof Error ? error.message : String(error), true);
      }
    }
    assetFileInput.value = '';
  }

  function exportProject(): void {
    try {
      const json = serializeProjectDocument(store.status.snapshot.document, {
        space: 2,
      });
      const name = store.status.snapshot.document.project.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      download(`${name || 'flixel-pixi-level'}.json`, json, 'application/json');
      store.markSaved();
      announce('Project exported.');
    } catch (error) {
      announce(error instanceof Error ? error.message : String(error), true);
    }
  }

  async function importProject(file: File): Promise<void> {
    try {
      const document = parseLevelProject(JSON.parse(await file.text()));
      store.replace('Imported project', {
        document,
        selectedEntityIds: [],
        snapToGrid: true,
        tool: 'select',
      });
      announce(`${file.name} loaded.`);
    } catch (error) {
      announce(error instanceof Error ? error.message : String(error), true);
    } finally {
      projectFileInput.value = '';
    }
  }

  function updateEntityField(field: string, value: string): void {
    const entityId = store.status.snapshot.selectedEntityIds.at(-1);
    if (entityId === undefined) return;
    store.update(`Changed ${field}`, (draft) => {
      const entity = activeScene(draft).entities.find(
        (candidate) => candidate.id === entityId,
      );
      if (entity === undefined) return;
      const properties = entityProperties(entity);
      const numeric = Number(value);
      if (field === 'name') entity.name = value;
      else if (
        field === 'layerId' &&
        sceneLayers(draft).some((layer) => layer.id === value)
      )
        properties.layerId = value;
      else if (field === 'x' && Number.isFinite(numeric))
        entity.position.x = numeric;
      else if (field === 'y' && Number.isFinite(numeric))
        entity.position.y = numeric;
      else if (field === 'rotation' && Number.isFinite(numeric))
        entity.rotation = (numeric * Math.PI) / 180;
      else if (field === 'scaleX' && Number.isFinite(numeric))
        (entity.scale ??= { x: 1, y: 1 }).x = numeric;
      else if (field === 'scaleY' && Number.isFinite(numeric))
        (entity.scale ??= { x: 1, y: 1 }).y = numeric;
      else if (
        [
          'width',
          'height',
          'originX',
          'originY',
          'zIndex',
          'frameWidth',
          'frameHeight',
          'frameColumn',
          'frameRow',
          'frameX',
          'frameY',
        ].includes(field) &&
        Number.isFinite(numeric)
      )
        properties[field] = numeric;
      else if (field === 'visible' || field === 'locked')
        properties[field] = value === 'true';
      if (
        ['width', 'height', 'scaleX', 'scaleY'].includes(field) &&
        entity.type === 'sprite'
      ) {
        const body = bodyForEntity(
          activeSceneSettings(draft).physics,
          entity.id,
        );
        const shape = body?.shapes[0];
        if (
          body !== undefined &&
          shape !== undefined &&
          (shape.kind === 'box' ||
            shape.kind === 'circle' ||
            shape.kind === 'capsule')
        ) {
          updateBodyShape(
            body,
            shape.kind,
            Number(properties.width ?? 64) * (entity.scale?.x ?? 1),
            Number(properties.height ?? 64) * (entity.scale?.y ?? 1),
          );
        }
      }
    });
  }

  function renderHierarchy(status: LevelEditorStatus): void {
    const container = host.querySelector<HTMLElement>('[data-hierarchy]');
    if (container === null) return;
    const entities = sortEntities(status.snapshot);
    const activeLayerId = activeLayer(status.snapshot).id;
    const emptyMarkup =
      entities.length === 0 &&
      !sceneLayers(status.snapshot).some(
        (layer) => Object.keys(layer.tilemap?.cells ?? {}).length > 0,
      )
        ? `<div class="empty-state compact-empty">${icon('select')}<strong>Your scene is empty</strong><span>Choose starter tiles in Tilesets to paint, or add a sprite.</span><button class="button primary compact" type="button" data-action="add-sprite">Add first sprite</button></div>`
        : '';
    container.innerHTML =
      emptyMarkup +
      [...sceneLayers(status.snapshot)]
        .sort((a, b) => b.order - a.order)
        .map((layer) => {
          const layerEntities = entities.filter(
            (entity) => layerForEntity(status.snapshot, entity).id === layer.id,
          );
          const rows = layerEntities
            .map((entity) => {
              const properties = entityProperties(entity);
              const selected = status.snapshot.selectedEntityIds.includes(
                entity.id,
              );
              return `<div class="tree-row${selected ? ' selected' : ''}" role="treeitem" aria-selected="${selected}" data-entity-id="${escapeHtml(entity.id)}" tabindex="${selected ? 0 : -1}">
          <button class="tree-main" type="button" data-action="select-entity" data-entity-id="${escapeHtml(entity.id)}">
            <span class="object-icon ${entity.type === 'particle-effect' ? 'particle' : ''}" aria-hidden="true">${entity.type === 'particle-effect' ? icon('particle') : icon('assets')}</span>
            <span><strong>${escapeHtml(entity.name ?? entity.id)}</strong><small>${escapeHtml(entity.type)}</small></span>
          </button>
          <button class="row-icon" type="button" data-action="toggle-visible" data-entity-id="${escapeHtml(entity.id)}" aria-label="${properties.visible === false ? 'Show' : 'Hide'} ${escapeHtml(entity.name ?? 'object')}">${icon(properties.visible === false ? 'hide' : 'visible')}</button>
          <div class="row-reorder"><button type="button" data-action="raise" data-entity-id="${escapeHtml(entity.id)}" aria-label="Move ${escapeHtml(entity.name ?? 'object')} forward">${icon('arrowUp')}</button><button type="button" data-action="lower" data-entity-id="${escapeHtml(entity.id)}" aria-label="Move ${escapeHtml(entity.name ?? 'object')} backward">${icon('arrowDown')}</button></div>
        </div>`;
            })
            .join('');
          return `<section class="layer-group${layer.id === activeLayerId ? ' active' : ''}" data-layer-id="${escapeHtml(layer.id)}"><div class="layer-row"><button type="button" class="layer-main" data-action="select-layer" data-layer-id="${escapeHtml(layer.id)}" aria-pressed="${layer.id === activeLayerId}">${icon('layers')}<span><strong>${escapeHtml(layer.name)}</strong><small>${escapeHtml(layer.purpose)} · ${Object.keys(layer.tilemap?.cells ?? {}).length} tiles · ${layerEntities.length} objects</small></span></button><button class="row-icon" type="button" data-action="toggle-layer-visible" data-layer-id="${escapeHtml(layer.id)}" aria-label="${layer.visible ? 'Hide' : 'Show'} ${escapeHtml(layer.name)}">${icon(layer.visible ? 'visible' : 'hide')}</button><button class="row-icon" type="button" data-action="toggle-layer-locked" data-layer-id="${escapeHtml(layer.id)}" aria-label="${layer.locked ? 'Unlock' : 'Lock'} ${escapeHtml(layer.name)}">${icon(layer.locked ? 'lock' : 'unlock')}</button></div>${rows || (Object.keys(layer.tilemap?.cells ?? {}).length ? '' : '<p class="layer-empty">Empty layer</p>')}</section>`;
        })
        .join('');
  }

  function renderAssets(status: LevelEditorStatus): void {
    const container = host.querySelector<HTMLElement>('[data-assets]');
    if (container === null) return;
    container.innerHTML = status.snapshot.document.assets
      .filter((asset) => asset.metadata?.hidden !== true)
      .flatMap((asset) => {
        const fileName = String(
          asset.metadata?.effectName ?? asset.metadata?.fileName ?? asset.id,
        );
        const frames = atlasFramesForAsset(asset);
        if (frames.length > 0) {
          const sheetWidth = Number(asset.metadata?.width ?? 1);
          const sheetHeight = Number(asset.metadata?.height ?? 1);
          const cards = frames.map((frame, frameIndex) => {
            const imageStyle = `width:${(sheetWidth / frame.width) * 100}%;height:${(sheetHeight / frame.height) * 100}%;left:${(-frame.x / frame.width) * 100}%;top:${(-frame.y / frame.height) * 100}%;`;
            return `<article class="asset-card atlas-frame"><button type="button" data-action="place-atlas-frame" data-asset-id="${escapeHtml(asset.id)}" data-frame-index="${frameIndex}" aria-label="Place ${escapeHtml(frame.name)} in scene"><span class="asset-preview"><img src="${escapeHtml(asset.src)}" alt="" style="${imageStyle}" /></span><strong>${escapeHtml(frame.name)}</strong><small>${frame.width} × ${frame.height}</small></button></article>`;
          });
          return [
            `<div class="asset-group-title"><span>${icon('layers')}<strong>${escapeHtml(fileName)}</strong><small>${frames.length} frames</small></span><button class="asset-delete inline" type="button" data-action="delete-asset" data-asset-id="${escapeHtml(asset.id)}" aria-label="Delete ${escapeHtml(fileName)}">${icon('close')}</button></div>`,
            ...cards,
          ];
        }
        const visual =
          asset.kind === 'image'
            ? `<img src="${escapeHtml(asset.src)}" alt="" />`
            : `<span class="particle-thumbnail" aria-hidden="true"><i></i><i></i><i></i><i></i></span>`;
        return [
          `<article class="asset-card"><button type="button" data-action="place-asset" data-asset-id="${escapeHtml(asset.id)}" aria-label="Place ${escapeHtml(fileName)} in scene"><span class="asset-preview">${visual}</span><strong>${escapeHtml(fileName)}</strong><small>${escapeHtml(asset.kind)}</small></button><button class="asset-delete" type="button" data-action="delete-asset" data-asset-id="${escapeHtml(asset.id)}" aria-label="Delete ${escapeHtml(fileName)}">${icon('close')}</button></article>`,
        ];
      })
      .join('');
  }

  function renderInspector(status: LevelEditorStatus): void {
    const container = host.querySelector<HTMLElement>('[data-inspector]');
    if (container === null) return;
    const entity = selectedEntity(status.snapshot);
    if (entity === undefined) {
      const settings = activeSceneSettings(status.snapshot);
      const layer = activeLayer(status.snapshot);
      const purposeOptions = layerPurposes
        .map(
          (purpose) =>
            `<option value="${purpose}"${purpose === layer.purpose ? ' selected' : ''}>${purpose}</option>`,
        )
        .join('');
      container.innerHTML = `<div class="empty-inspector">${icon('select')}<strong>Select an object</strong><p>Choose an object to edit it, or configure the active layer below.</p></div><fieldset><legend>Active layer</legend><label>Name<input data-layer-field="name" value="${escapeHtml(layer.name)}"/></label><label>Purpose<select data-layer-field="purpose">${purposeOptions}</select></label><p class="field-help">Tiles and objects are added to this layer.</p><label>Tile cell size<input data-layer-field="tileSize" type="number" min="1" max="1024" step="1" value="${layer.tilemap?.tileSize ?? settings.gridSize}" ${Object.keys(layer.tilemap?.cells ?? {}).length ? 'disabled' : ''}/></label><p class="field-help">${Object.keys(layer.tilemap?.cells ?? {}).length ? 'Cell size is fixed while this layer has tiles. Source tiles are scaled to fit.' : 'Set the cell size before painting. Source tiles are scaled to fit.'}</p></fieldset><fieldset><legend>Scene</legend><label>Canvas size<span><input data-scene-field="width" type="number" min="64" value="${settings.width}"/><b>×</b><input data-scene-field="height" type="number" min="64" value="${settings.height}"/></span></label><label>Grid size<input data-scene-field="gridSize" type="number" min="1" value="${settings.gridSize}"/></label><label>Background<input data-scene-field="background" type="color" value="${escapeHtml(settings.background)}"/></label></fieldset>`;
      return;
    }
    const properties = entityProperties(entity);
    const world = activeSceneSettings(status.snapshot).physics;
    const body = bodyForEntity(world, entity.id);
    const selectedBodies = status.snapshot.selectedEntityIds
      .map((id) => bodyForEntity(world, id))
      .filter((candidate) => candidate !== undefined);
    const bodyMarkup =
      entity.type === 'particle-effect'
        ? `<p class="field-help">Particle effects are visual emitters and cannot own a rigid physics body.</p>`
        : body === undefined
          ? `<button class="button full ghost" type="button" data-action="add-physics">${icon('add')} Add physics body</button><p class="field-help">Bodies and joints use portable Flixel-Pixi schemas and the installed adapter at runtime.</p>`
          : `<label>Body type<select data-body-field="type"><option value="dynamic"${body.type === 'dynamic' ? ' selected' : ''}>Dynamic</option><option value="kinematic"${body.type === 'kinematic' ? ' selected' : ''}>Kinematic</option><option value="static"${body.type === 'static' ? ' selected' : ''}>Static</option></select></label><label>Collider<select data-body-field="shape"><option value="box"${body.shapes[0]?.kind === 'box' ? ' selected' : ''}>Box</option><option value="circle"${body.shapes[0]?.kind === 'circle' ? ' selected' : ''}>Circle</option><option value="capsule"${body.shapes[0]?.kind === 'capsule' ? ' selected' : ''}>Capsule</option></select></label><div class="field-pair"><label><span>Friction</span><input data-body-field="friction" type="number" min="0" step="0.05" value="${body.material?.friction ?? 0.4}"/></label><label><span>Bounce</span><input data-body-field="restitution" type="number" min="0" max="1" step="0.05" value="${body.material?.restitution ?? 0.1}"/></label></div><label>Gravity scale<input data-body-field="gravityScale" type="number" step="0.1" value="${body.gravityScale ?? 1}"/></label><button class="button full danger-outline" type="button" data-action="remove-physics">Remove physics body</button>`;
    const jointMarkup =
      selectedBodies.length === 2
        ? `<div class="joint-create"><label>Connect selected<select data-joint-type><option value="distance">Distance / spring</option><option value="revolute">Revolute / hinge</option><option value="prismatic">Prismatic / slider</option><option value="weld">Weld / rigid</option><option value="wheel">Wheel / suspension</option></select></label><button class="button full ghost" type="button" data-action="add-joint">${icon('add')} Create joint</button></div>`
        : `<p class="field-help">Shift-select two objects with physics bodies to create a joint.</p>`;
    const joints = (world.joints ?? [])
      .filter((joint) => joint.bodyA === body?.id || joint.bodyB === body?.id)
      .map(
        (joint) =>
          `<div class="joint-row"><span><strong>${escapeHtml(joint.type)}</strong><small>${escapeHtml(joint.id.slice(0, 14))}</small></span><button type="button" data-action="delete-joint" data-joint-id="${escapeHtml(joint.id)}" aria-label="Delete ${escapeHtml(joint.type)} joint">${icon('close')}</button></div>`,
      )
      .join('');
    const layerOptions = [...sceneLayers(status.snapshot)]
      .sort((a, b) => a.order - b.order)
      .map(
        (layer) =>
          `<option value="${escapeHtml(layer.id)}"${layer.id === layerForEntity(status.snapshot, entity).id ? ' selected' : ''}>${escapeHtml(layer.name)} · ${escapeHtml(layer.purpose)}</option>`,
      )
      .join('');
    container.innerHTML = `<fieldset><legend>Object</legend><label>Name<input data-entity-field="name" value="${escapeHtml(entity.name ?? '')}"/></label><label>Purpose layer<select data-entity-field="layerId">${layerOptions}</select></label><div class="segmented"><button type="button" data-action="toggle-visible" data-entity-id="${escapeHtml(entity.id)}" aria-pressed="${properties.visible !== false}">Visible</button><button type="button" data-action="toggle-locked" data-entity-id="${escapeHtml(entity.id)}" aria-pressed="${properties.locked === true}">Locked</button></div><button class="button full ghost" type="button" data-action="duplicate">${icon('duplicate')} Duplicate</button></fieldset>
      <fieldset><legend>Transform</legend><div class="field-pair"><label><span>X</span><input data-entity-field="x" type="number" step="1" value="${entity.position.x.toFixed(1)}"/></label><label><span>Y</span><input data-entity-field="y" type="number" step="1" value="${entity.position.y.toFixed(1)}"/></label></div><label>Rotation <span class="unit-field"><input data-entity-field="rotation" type="number" step="1" value="${(((entity.rotation ?? 0) * 180) / Math.PI).toFixed(1)}"/><b>°</b></span></label><div class="field-pair"><label><span>Scale X</span><input data-entity-field="scaleX" type="number" min="0.05" step="0.05" value="${(entity.scale?.x ?? 1).toFixed(2)}"/></label><label><span>Scale Y</span><input data-entity-field="scaleY" type="number" min="0.05" step="0.05" value="${(entity.scale?.y ?? 1).toFixed(2)}"/></label></div></fieldset>
      <fieldset><legend>Sprite</legend><div class="field-pair"><label><span>Width</span><input data-entity-field="width" type="number" min="1" value="${Number(properties.width ?? 64)}"/></label><label><span>Height</span><input data-entity-field="height" type="number" min="1" value="${Number(properties.height ?? 64)}"/></label></div><div class="field-pair"><label><span>Origin X</span><input data-entity-field="originX" type="number" min="0" max="1" step="0.05" value="${Number(properties.originX ?? 0.5)}"/></label><label><span>Origin Y</span><input data-entity-field="originY" type="number" min="0" max="1" step="0.05" value="${Number(properties.originY ?? 0.5)}"/></label></div><label>Order within layer<input data-entity-field="zIndex" type="number" step="1" value="${Number(properties.zIndex ?? 0)}"/></label>${entity.type === 'sprite' ? `<details class="texture-region" open><summary>Texture region</summary><div class="field-pair"><label><span>Frame width</span><input data-entity-field="frameWidth" type="number" min="0" step="1" value="${Number(properties.frameWidth ?? 0)}"/></label><label><span>Frame height</span><input data-entity-field="frameHeight" type="number" min="0" step="1" value="${Number(properties.frameHeight ?? 0)}"/></label></div>${properties.frameX !== undefined || properties.frameY !== undefined ? `<div class="field-pair"><label><span>Pixel X</span><input data-entity-field="frameX" type="number" min="0" step="1" value="${Number(properties.frameX ?? 0)}"/></label><label><span>Pixel Y</span><input data-entity-field="frameY" type="number" min="0" step="1" value="${Number(properties.frameY ?? 0)}"/></label></div><p class="field-help">This exact region came from the imported atlas XML.</p>` : `<div class="field-pair"><label><span>Column</span><input data-entity-field="frameColumn" type="number" min="0" step="1" value="${Number(properties.frameColumn ?? 0)}"/></label><label><span>Row</span><input data-entity-field="frameRow" type="number" min="0" step="1" value="${Number(properties.frameRow ?? 0)}"/></label></div><p class="field-help">Manual grid regions use zero-based columns and rows. Use 0 × 0 frame size for the full image.</p>`}</details>` : ''}</fieldset>
      <fieldset><legend>Physics</legend>${bodyMarkup}</fieldset><fieldset><legend>Joints</legend>${jointMarkup}${joints}</fieldset>`;
  }

  function render(status: LevelEditorStatus): void {
    const tileMode = isTileTool(status.snapshot.tool);
    host.querySelector('.stage')?.classList.toggle('tile-mode', tileMode);
    const contextNode = host.querySelector<HTMLElement>('[data-tile-context]');
    if (contextNode) {
      contextNode.hidden = !tileMode;
      contextNode.textContent = tileContext(status);
    }
    const hint = host.querySelector<HTMLElement>('.canvas-hint');
    if (hint)
      hint.textContent = tileMode
        ? 'Drag to paint · Shift-click draws a line · Right-drag captures a stamp · Space pans · Esc cancels'
        : 'Space + drag pans · wheel scrolls · ⌘/Ctrl + wheel zooms · ⌘/Ctrl + D duplicates';
    const tileCount = host.querySelector<HTMLElement>('[data-tile-count]');
    if (tileCount)
      tileCount.textContent = `${sceneLayers(status.snapshot).reduce((sum, layer) => sum + Object.keys(layer.tilemap?.cells ?? {}).length, 0)} tiles`;
    host
      .querySelector('[data-action="show-grid"]')
      ?.setAttribute(
        'aria-pressed',
        String(status.snapshot.showGrid !== false),
      );
    renderHierarchy(status);
    renderAssets(status);
    renderInspector(status);
    const settings = activeSceneSettings(status.snapshot);
    const scene = activeScene(status.snapshot);
    host.querySelectorAll<HTMLElement>('[data-scene-name]').forEach((node) => {
      node.textContent = scene.name;
    });
    const projectName = host.querySelector<HTMLInputElement>(
      '[data-field="project-name"]',
    );
    if (projectName !== null && document.activeElement !== projectName)
      projectName.value = status.snapshot.document.project.name;
    const statusNode = host.querySelector<HTMLElement>('[data-status]');
    const countNode = host.querySelector<HTMLElement>('[data-count]');
    const sizeNode = host.querySelector<HTMLElement>('[data-scene-size]');
    const dirtyNode = host.querySelector<HTMLElement>('[data-dirty]');
    const zoomNode = host.querySelector<HTMLOutputElement>('[data-zoom]');
    if (statusNode !== null) statusNode.textContent = status.label;
    if (countNode !== null)
      countNode.textContent = `${scene.entities.length} object${scene.entities.length === 1 ? '' : 's'}`;
    if (sizeNode !== null)
      sizeNode.textContent = `${settings.width} × ${settings.height}`;
    if (dirtyNode !== null) dirtyNode.classList.toggle('dirty', status.dirty);
    if (zoomNode !== null)
      zoomNode.textContent = `${Math.round(viewport.zoom * 100)}%`;
    host
      .querySelectorAll<HTMLButtonElement>('[data-action="undo"]')
      .forEach((node) => (node.disabled = !status.canUndo));
    host
      .querySelectorAll<HTMLButtonElement>('[data-action="redo"]')
      .forEach((node) => (node.disabled = !status.canRedo));
    host
      .querySelectorAll<HTMLButtonElement>('[data-tool]')
      .forEach((node) =>
        node.setAttribute(
          'aria-pressed',
          String(node.dataset.tool === status.snapshot.tool),
        ),
      );
    host
      .querySelectorAll<HTMLButtonElement>('[data-action="toggle-grid"]')
      .forEach((node) =>
        node.setAttribute('aria-pressed', String(status.snapshot.snapToGrid)),
      );
  }

  const tilesetHost = host.querySelector<HTMLElement>('[data-tilesets]');
  if (!tilesetHost) throw new Error('Tileset dock is missing.');
  const disposePalette = mountTilePalette(tilesetHost, store, () =>
    assetFileInput.click(),
  );
  canvas.addEventListener('tile-message', (event) =>
    announce((event as CustomEvent<string>).detail, true),
  );
  canvas.addEventListener('tile-hover', (event) => {
    const cell = (event as CustomEvent<{ x: number; y: number }>).detail;
    const node = host.querySelector<HTMLElement>('[data-tile-position]');
    if (node)
      node.textContent = host
        .querySelector('.stage')
        ?.classList.contains('tile-mode')
        ? `Cell ${cell.x}, ${cell.y}`
        : '';
  });
  const unsubscribe = store.subscribe((status) => {
    render(status);
    if (!runtimeDialog.open || !previewReady) return;
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(sendProjectToPreview, 160);
  });

  host.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-action], [data-tool], [data-panel-tab]',
    );
    if (target === null) return;
    const panelTab = target.dataset.panelTab;
    if (panelTab !== undefined) {
      host
        .querySelectorAll<HTMLElement>('[data-panel]')
        .forEach((panel) => (panel.hidden = panel.dataset.panel !== panelTab));
      host
        .querySelectorAll<HTMLElement>('[data-panel-tab]')
        .forEach((tab) =>
          tab.setAttribute(
            'aria-selected',
            String(tab.dataset.panelTab === panelTab),
          ),
        );
      return;
    }
    const tool = target.dataset.tool as EditorTool | undefined;
    if (tool !== undefined) {
      setTool(tool);
      canvas.focus();
      return;
    }
    const action = target.dataset.action;
    if (action === 'show-grid') {
      store.update(
        'Toggled grid visibility',
        (draft) => {
          draft.showGrid = draft.showGrid === false;
        },
        false,
      );
      return;
    }
    const entityId = target.dataset.entityId;
    const assetId = target.dataset.assetId;
    if (action === 'undo') store.undo();
    else if (action === 'redo') store.redo();
    else if (action === 'duplicate') duplicateSelected();
    else if (action === 'add-layer') addLayer();
    else if (action === 'add-sprite') addSprite();
    else if (action === 'delete') deleteSelected();
    else if (action === 'upload-asset') assetInput.click();
    else if (action === 'place-asset' && assetId !== undefined) {
      const asset = store.status.snapshot.document.assets.find(
        (candidate) => candidate.id === assetId,
      );
      if (asset?.kind === 'data') {
        store.update('Added particle effect', (draft) => {
          const scene = activeScene(draft);
          const entity = createSpriteEntity(assetId, scene.entities.length + 1);
          entity.type = 'particle-effect';
          entity.name = String(asset.metadata?.effectName ?? 'Particle effect');
          entityProperties(entity).layerId = activeLayer(draft).id;
          scene.entities.push(entity);
          draft.selectedEntityIds = [entity.id];
          draft.tool = 'select';
        });
      } else addSprite(assetId);
    } else if (action === 'place-atlas-frame' && assetId !== undefined) {
      const asset = store.status.snapshot.document.assets.find(
        (candidate) => candidate.id === assetId,
      );
      const frameIndex = Number(target.dataset.frameIndex);
      const frame =
        asset === undefined
          ? undefined
          : atlasFramesForAsset(asset)[frameIndex];
      if (frame !== undefined) addSprite(assetId, frame);
    } else if (action === 'delete-asset' && assetId !== undefined) {
      const inUse =
        store.status.snapshot.document.scenes.some((scene) =>
          scene.entities.some(
            (entity) => entityProperties(entity).assetId === assetId,
          ),
        ) ||
        Object.values(
          getEditorExtension(store.status.snapshot.document).scenes,
        ).some((settings) =>
          settings.layers?.some((layer) =>
            Object.values(layer.tilemap?.cells ?? {}).some(
              (tile) => tile.assetId === assetId,
            ),
          ),
        ) ||
        particleEffectUsesAsset(store.status.snapshot, assetId);
      if (inUse)
        announce(
          'Remove objects and tiles using this asset before deleting it.',
          true,
        );
      else
        store.update('Deleted asset', (draft) => {
          draft.document.assets = draft.document.assets.filter(
            (asset) => asset.id !== assetId,
          );
          if (draft.tileStamp?.tiles.some((tile) => tile?.assetId === assetId))
            delete draft.tileStamp;
        });
    } else if (action === 'select-entity' && entityId !== undefined) {
      const additive = event instanceof MouseEvent && event.shiftKey;
      store.update(
        'Selected entity',
        (draft) => {
          draft.selectedEntityIds = additive
            ? [...new Set([...draft.selectedEntityIds, entityId])]
            : [entityId];
        },
        false,
      );
      canvas.focus();
    } else if (action === 'select-layer') {
      const layerId = target.dataset.layerId;
      if (layerId === undefined) return;
      store.update(
        'Selected active layer',
        (draft) => {
          activeSceneSettings(draft).activeLayerId = layerId;
          draft.selectedEntityIds = [];
        },
        false,
      );
    } else if (
      action === 'toggle-layer-visible' ||
      action === 'toggle-layer-locked'
    ) {
      const layerId = target.dataset.layerId;
      if (layerId === undefined) return;
      store.update(`Changed layer`, (draft) => {
        const settings = activeSceneSettings(draft);
        const layers = (settings.layers ??= sceneLayers(draft).map((layer) => ({
          ...layer,
        })));
        const layer = layers.find((candidate) => candidate.id === layerId);
        if (layer === undefined) return;
        if (action === 'toggle-layer-visible') layer.visible = !layer.visible;
        else layer.locked = !layer.locked;
      });
    } else if (
      (action === 'toggle-visible' || action === 'toggle-locked') &&
      entityId !== undefined
    ) {
      const key = action === 'toggle-visible' ? 'visible' : 'locked';
      store.update(`Toggled ${key}`, (draft) => {
        const entity = activeScene(draft).entities.find(
          (candidate) => candidate.id === entityId,
        );
        if (entity !== undefined)
          entityProperties(entity)[key] =
            entityProperties(entity)[key] !== true;
      });
    } else if (action === 'raise' && entityId !== undefined)
      reorder(entityId, 1);
    else if (action === 'lower' && entityId !== undefined)
      reorder(entityId, -1);
    else if (action === 'toggle-grid')
      store.update(
        'Toggled grid snapping',
        (draft) => {
          draft.snapToGrid = !draft.snapToGrid;
        },
        false,
      );
    else if (action === 'zoom-in') {
      viewport.setZoom(viewport.zoom * 1.2);
      render(store.status);
    } else if (action === 'zoom-out') {
      viewport.setZoom(viewport.zoom / 1.2);
      render(store.status);
    } else if (action === 'zoom-fit') {
      viewport.focusSelection();
      render(store.status);
    } else if (action === 'export') exportProject();
    else if (action === 'import') projectInput.click();
    else if (action === 'preview') openPreview();
    else if (action === 'close-preview') runtimeDialog.close();
    else if (action === 'add-physics') {
      store.update('Added physics body', (draft) => {
        const entity = selectedEntity(draft);
        if (entity === undefined) return;
        const world = activeSceneSettings(draft).physics;
        if (bodyForEntity(world, entity.id) === undefined)
          world.bodies.push(createBodyForEntity(entity));
      });
      announce('Physics body added.');
    } else if (action === 'remove-physics') {
      store.update('Removed physics body', (draft) => {
        const entity = selectedEntity(draft);
        if (entity === undefined) return;
        const world = activeSceneSettings(draft).physics;
        const body = bodyForEntity(world, entity.id);
        if (body !== undefined) removeBody(world, body.id);
      });
    } else if (action === 'add-joint') {
      const type = host.querySelector<HTMLSelectElement>('[data-joint-type]')
        ?.value as SupportedJointType | undefined;
      if (type === undefined) return;
      store.update(`Added ${type} joint`, (draft) => {
        const [idA, idB] = draft.selectedEntityIds;
        if (idA === undefined || idB === undefined) return;
        const scene = activeScene(draft);
        const entityA = scene.entities.find(
          (candidate) => candidate.id === idA,
        );
        const entityB = scene.entities.find(
          (candidate) => candidate.id === idB,
        );
        if (entityA === undefined || entityB === undefined) return;
        const world = activeSceneSettings(draft).physics;
        const bodyA = bodyForEntity(world, idA);
        const bodyB = bodyForEntity(world, idB);
        if (bodyA === undefined || bodyB === undefined) return;
        (world.joints ??= []).push(
          createJoint(type, bodyA, bodyB, entityA, entityB),
        );
      });
      announce(`${type} joint created.`);
    } else if (action === 'delete-joint') {
      const jointId = target.dataset.jointId;
      if (jointId === undefined) return;
      store.update('Deleted joint', (draft) => {
        const world = activeSceneSettings(draft).physics;
        world.joints = (world.joints ?? []).filter(
          (joint) => joint.id !== jointId,
        );
      });
    }
  });

  host.addEventListener('click', (event) => {
    const command = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-preview-command]',
    )?.dataset.previewCommand;
    if (command === 'pause' || command === 'resume' || command === 'reset')
      previewPeer?.send('preview.command', { command });
  });

  host.addEventListener('change', (event) => {
    const target = event.target as HTMLInputElement;
    if (target === assetInput && target.files !== null)
      void importAssets(target.files);
    else if (target === projectInput && target.files?.[0] !== undefined)
      void importProject(target.files[0]);
    else if (target.matches('[data-entity-field]'))
      updateEntityField(target.dataset.entityField ?? '', target.value);
    else if (target.matches('[data-layer-field]')) {
      const field = target.dataset.layerField;
      store.update(`Changed layer ${field ?? ''}`, (draft) => {
        const settings = activeSceneSettings(draft);
        const layers = (settings.layers ??= sceneLayers(draft).map((layer) => ({
          ...layer,
        })));
        const layer = layers.find(
          (candidate) => candidate.id === activeLayer(draft).id,
        );
        if (layer === undefined) return;
        if (field === 'tileSize') {
          const size = Number(target.value);
          if (
            Number.isInteger(size) &&
            size >= 1 &&
            size <= 1024 &&
            !Object.keys(layer.tilemap?.cells ?? {}).length
          )
            layer.tilemap = { tileSize: size, cells: {} };
        } else if (field === 'name')
          layer.name = target.value.trim() || 'Untitled layer';
        else if (
          field === 'purpose' &&
          layerPurposes.includes(target.value as LayerPurpose)
        )
          layer.purpose = target.value as LayerPurpose;
      });
    } else if (target.matches('[data-body-field]')) {
      const field = target.dataset.bodyField ?? '';
      store.update(`Changed physics ${field}`, (draft) => {
        const entity = selectedEntity(draft);
        if (entity === undefined) return;
        const body = bodyForEntity(
          activeSceneSettings(draft).physics,
          entity.id,
        );
        if (body === undefined) return;
        if (
          field === 'type' &&
          ['dynamic', 'kinematic', 'static'].includes(target.value)
        )
          body.type = target.value as typeof body.type;
        else if (
          field === 'shape' &&
          ['box', 'circle', 'capsule'].includes(target.value)
        ) {
          const properties = entityProperties(entity);
          updateBodyShape(
            body,
            target.value as 'box' | 'circle' | 'capsule',
            Number(properties.width ?? 64) * (entity.scale?.x ?? 1),
            Number(properties.height ?? 64) * (entity.scale?.y ?? 1),
          );
        } else {
          const value = Number(target.value);
          if (!Number.isFinite(value)) return;
          if (field === 'gravityScale') body.gravityScale = value;
          else if (field === 'friction' || field === 'restitution')
            (body.material ??= {})[field] = value;
        }
      });
    } else if (target.matches('[data-scene-field]')) {
      const field = target.dataset.sceneField ?? '';
      store.update(`Changed scene ${field}`, (draft) => {
        const settings = activeSceneSettings(draft);
        if (field === 'background') settings.background = target.value;
        else {
          const value = Number(target.value);
          if (
            Number.isFinite(value) &&
            value > 0 &&
            ['width', 'height', 'gridSize'].includes(field)
          )
            settings[field as 'width' | 'height' | 'gridSize'] = value;
        }
      });
    } else if (target.matches('[data-field="project-name"]')) {
      store.update('Renamed project', (draft) => {
        draft.document.project.name = target.value.trim() || 'Untitled game';
      });
    }
  });

  const onEditorKeyDown = (event: KeyboardEvent): void => {
    if (
      runtimeDialog.open ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    )
      return;
    const key = event.key.toLowerCase();
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const tileTools = {
      b: 'brush',
      e: 'eraser',
      f: 'fill',
      p: 'rectangle',
      i: 'eyedropper',
    } as const;
    if (key in tileTools) {
      setTool(tileTools[key as keyof typeof tileTools]);
      event.preventDefault();
      return;
    }
    if (['v', 'h', 'g', 'r', 's'].includes(key)) {
      setTool(
        (
          { v: 'select', h: 'pan', g: 'move', r: 'rotate', s: 'scale' } as const
        )[key as 'v' | 'h' | 'g' | 'r' | 's'],
      );
      event.preventDefault();
      return;
    }
    if (event.target !== canvas) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      deleteSelected();
      event.preventDefault();
      return;
    }
    if (
      !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)
    )
      return;
    const distance = event.shiftKey
      ? activeSceneSettings(store.status.snapshot).gridSize
      : 1;
    const dx =
      event.key === 'ArrowLeft'
        ? -distance
        : event.key === 'ArrowRight'
          ? distance
          : 0;
    const dy =
      event.key === 'ArrowUp'
        ? -distance
        : event.key === 'ArrowDown'
          ? distance
          : 0;
    store.update('Moved selection with keyboard', (draft) => {
      const selected = new Set(draft.selectedEntityIds);
      activeScene(draft).entities.forEach((entity) => {
        if (
          selected.has(entity.id) &&
          entityProperties(entity).locked !== true
        ) {
          entity.position.x += dx;
          entity.position.y += dy;
        }
      });
    });
    event.preventDefault();
  };
  host.addEventListener('keydown', onEditorKeyDown);

  const onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (!(event.metaKey || event.ctrlKey)) return;
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement ||
      runtimeDialog.open
    )
      return;
    if (event.key.toLowerCase() === 'z') {
      if (event.shiftKey) store.redo();
      else store.undo();
      event.preventDefault();
    } else if (event.key === "'") {
      store.update(
        'Toggled grid snapping',
        (draft) => {
          draft.snapToGrid = !draft.snapToGrid;
        },
        false,
      );
      event.preventDefault();
    } else if (event.key.toLowerCase() === 's') {
      exportProject();
      event.preventDefault();
    } else if (event.key.toLowerCase() === 'd') {
      duplicateSelected();
      event.preventDefault();
    }
  };
  document.addEventListener('keydown', onDocumentKeyDown);

  return () => {
    host.removeEventListener('keydown', onEditorKeyDown);
    document.removeEventListener('keydown', onDocumentKeyDown);
    unsubscribe();
    disposePalette();
    viewport.destroy();
    previewPeer?.destroy();
    window.clearTimeout(previewTimer);
    window.clearTimeout(toastTimer);
  };
}
