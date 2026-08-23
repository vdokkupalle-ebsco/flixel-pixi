import { describe, expect, it } from 'vitest';

import {
  renderEditorShell,
  renderEmitterLayerList,
} from '../src/editor-shell';
import { createEffectDocument } from '../src/editor-store';
import { starterPresets } from '../src/presets';

describe('particle editor shell', () => {
  it('renders accessible workspace regions and preview controls', () => {
    const host = document.createElement('div');
    const shell = renderEditorShell(host, starterPresets);

    expect(shell.root.getAttribute('aria-labelledby')).toBe('editor-title');
    expect(host.querySelector('h1')?.textContent).toBe('Particle Editor');
    expect(host.querySelectorAll('aside')).toHaveLength(2);
    expect(shell.canvasHost.getAttribute('aria-label')).toBe(
      'Particle preview canvas',
    );
    expect(shell.pauseButton.getAttribute('aria-pressed')).toBe('false');
    expect(host.querySelector('[data-timeline]')).toBeNull();
    expect(host.querySelector('[name="blendMode"]')).not.toBeNull();
    expect(host.querySelector('[name="textureShape"]')).not.toBeNull();
    expect(host.querySelector('[data-pointer-mode]')).not.toBeNull();
    expect(
      host.querySelector('[data-action="restart"]')?.textContent,
    ).toContain('Restart effect');
    expect(shell.status.getAttribute('aria-live')).toBe('polite');
    expect(shell.addEmitterButton.getAttribute('aria-label')).toBe('Add emitter');
  });

  it('renders multi-emitter layer list with accessible selection and toggle controls', () => {
    const starter = starterPresets[0];
    if (starter === undefined) throw new Error('starter preset not found');
    const doc = createEffectDocument(starter, 'circle');
    const selectedId = doc.emitters[0]?.layerId ?? '';

    const html = renderEmitterLayerList(doc, selectedId);
    expect(html).toContain('data-layer-id');
    expect(html).toContain('aria-current="true"');
    expect(html).toContain('data-action="select-emitter"');
  });

  it('replaces stale host content when mounted again', () => {
    const host = document.createElement('div');
    host.innerHTML = '<p>stale</p>';
    renderEditorShell(host, starterPresets);
    renderEditorShell(host, starterPresets);

    expect(host.querySelectorAll('.editor')).toHaveLength(1);
    expect(host.textContent).not.toContain('stale');
  });
});
