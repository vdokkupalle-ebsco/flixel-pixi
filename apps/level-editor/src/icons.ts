import {
  icon as renderIcon,
  type IconDefinition,
} from '@fortawesome/fontawesome-svg-core';
import {
  faArrowPointer,
  faArrowDown,
  faArrowUp,
  faBorderAll,
  faEye,
  faEyeSlash,
  faFileExport,
  faFloppyDisk,
  faImage,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPlay,
  faPlus,
  faRotateLeft,
  faRotateRight,
  faTrash,
  faUpDownLeftRight,
  faWandMagicSparkles,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

const icons = {
  add: faPlus,
  arrowDown: faArrowDown,
  arrowUp: faArrowUp,
  assets: faImage,
  delete: faTrash,
  export: faFileExport,
  hide: faEyeSlash,
  grid: faBorderAll,
  move: faUpDownLeftRight,
  particle: faWandMagicSparkles,
  play: faPlay,
  redo: faRotateRight,
  rotate: faRotateRight,
  save: faFloppyDisk,
  select: faArrowPointer,
  undo: faRotateLeft,
  visible: faEye,
  close: faXmark,
  zoomIn: faMagnifyingGlassPlus,
  zoomOut: faMagnifyingGlassMinus,
} satisfies Record<string, IconDefinition>;

export function icon(name: keyof typeof icons, label?: string): string {
  return renderIcon(icons[name], {
    attributes:
      label === undefined
        ? { 'aria-hidden': 'true', focusable: 'false' }
        : { 'aria-label': label, role: 'img' },
  }).html.join('');
}
