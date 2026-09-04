import type { LevelEditorStore } from './editor-store';
import { deleteLayer, layerDeletionSummary } from './layer-editing';

export function confirmLayerDeletion(
  store: LevelEditorStore,
  layerId: string,
  announce: (message: string) => void,
  restoreFocus: () => void,
): () => void {
  const status = store.status,
    summary = layerDeletionSummary(status.snapshot, layerId);
  if (!summary) return () => undefined;
  const dialog = document.createElement('dialog');
  dialog.className = 'layer-delete-dialog';
  dialog.setAttribute('aria-labelledby', 'layer-delete-title');
  dialog.setAttribute('aria-describedby', 'layer-delete-description');
  dialog.innerHTML =
    '<h2 id="layer-delete-title">Delete layer?</h2><p id="layer-delete-description"></p><p>This removes the layer and its contents. You can undo this action.</p><p data-delete-error role="alert"></p><div class="dialog-actions"><button type="button" data-cancel>Cancel</button><button type="button" class="danger-outline" data-confirm>Delete layer</button></div>';
  const description = dialog.querySelector('#layer-delete-description');
  const cancel = dialog.querySelector<HTMLButtonElement>('[data-cancel]');
  const confirm = dialog.querySelector<HTMLButtonElement>('[data-confirm]');
  if (!description || !cancel || !confirm)
    throw new Error('Missing delete dialog controls.');
  description.textContent = `Delete “${summary.name}” and its ${summary.layers > 1 ? `${summary.layers - 1} nested layer${summary.layers === 2 ? '' : 's'}, ` : ''}${summary.tiles} tiles, ${summary.objects} objects, ${summary.bodies} physics bodies, and ${summary.joints} connected joints?`;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    dialog.close();
    dialog.remove();
    restoreFocus();
  };
  cancel.addEventListener('click', close);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  confirm.addEventListener('click', () => {
    if (store.status.revision !== status.revision) {
      const error = dialog.querySelector('[data-delete-error]');
      if (error)
        error.textContent =
          'The scene changed while this dialog was open. Cancel and try again to review the current contents.';
      confirm.disabled = true;
      return;
    }
    const deleted = deleteLayer(store, layerId);
    close();
    announce(
      deleted
        ? `Deleted layer “${summary.name}”. Undo restores its contents.`
        : 'Layer could not be deleted. Unlock it and keep at least one layer.',
    );
  });
  document.body.append(dialog);
  dialog.showModal();
  cancel.focus();
  return close;
}
