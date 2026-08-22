import { describe, expect, it } from 'vitest';

import { renderEditorShell } from '../src/editor-shell';
import { starterPresets } from '../src/presets';

describe('particle editor shell', () => {
  it('renders accessible workspace regions and preview controls', () => {
    const host = document.createElement('div');
    const shell = renderEditorShell(host, starterPresets);

    expect(shell.root.getAttribute('aria-labelledby')).toBe('editor-title');
    expect(host.querySelector('h1')?.textContent).toBe('Particle Lab');
    expect(host.querySelectorAll('aside')).toHaveLength(2);
    expect(shell.canvasHost.getAttribute('aria-label')).toBe(
      'Particle preview canvas',
    );
    expect(shell.pauseButton.getAttribute('aria-pressed')).toBe('false');
    expect(
      host.querySelector('[data-action="restart"]')?.textContent,
    ).toContain('Restart effect');
    expect(shell.status.getAttribute('aria-live')).toBe('polite');
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
