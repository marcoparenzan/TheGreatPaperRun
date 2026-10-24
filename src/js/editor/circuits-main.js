import { CircuitEditor } from './CircuitEditor.js?v=elevation-2';
import { CircuitJsonEditor } from './CircuitJsonEditor.js?v=elevation-2';

document.addEventListener('DOMContentLoaded', () => {
  const visual = new CircuitEditor();
  new CircuitJsonEditor(visual);
});
