import './styles.css';

import { renderEditorShell } from './editor-shell';
import { createParticlePreview } from './preview';

const host = document.querySelector<HTMLElement>('#app');
if (host === null) throw new Error('Particle editor host was not found.');

const shell = renderEditorShell(host);
const preview = await createParticlePreview(shell.canvasHost, (diagnostics) => {
  shell.activeCount.textContent = `${String(diagnostics.activeCount)} / 160`;
});
shell.status.textContent = 'Preview running';

let paused = false;
shell.pauseButton.addEventListener('click', () => {
  paused = !paused;
  shell.pauseButton.textContent = paused ? 'Resume' : 'Pause';
  shell.pauseButton.setAttribute('aria-pressed', String(paused));
  if (paused) preview.pause();
  else preview.resume();
  shell.status.textContent = paused ? 'Preview paused' : 'Preview running';
});
shell.restartButton.addEventListener('click', () => {
  preview.restart();
  shell.status.textContent = 'Effect restarted';
});
window.addEventListener('beforeunload', () => preview.destroy(), {
  once: true,
});
