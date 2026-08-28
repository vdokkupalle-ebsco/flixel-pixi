import './styles.css';

import { LevelEditorStore } from './editor-store';
import { createInitialProject } from './model';
import { mountEditor } from './shell';

const host = document.querySelector<HTMLDivElement>('#app');
if (host === null) throw new Error('Level Editor host is missing.');

const store = new LevelEditorStore({
  document: createInitialProject(),
  selectedEntityIds: [],
  snapToGrid: true,
  tool: 'select',
});

mountEditor(host, store);
