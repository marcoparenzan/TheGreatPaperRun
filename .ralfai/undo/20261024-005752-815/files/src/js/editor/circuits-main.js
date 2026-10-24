import { CircuitEditor } from './CircuitEditor.js';
import { CircuitJsonEditor } from './CircuitJsonEditor.js';

document.addEventListener('DOMContentLoaded', () => {
  const visual = new CircuitEditor();
  new CircuitJsonEditor(visual);
});
