import { FrameComparator } from './FrameComparator.js';
import { SpriteMapEditor } from './SpriteMapEditor.js';
import { AtlasImageEditor } from './AtlasImageEditor.js';

document.addEventListener('DOMContentLoaded', () => {
  const comparator = new FrameComparator();
  const mapEditor = new SpriteMapEditor(comparator);
  new AtlasImageEditor(comparator, mapEditor);
});
