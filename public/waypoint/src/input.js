// Input (PRD §4.2, §5.4): Neural Band + captouch arrive as ArrowUp/Down/
// Left/Right + Enter keydown. Desktop keyboard matches 1:1; phone gets an
// on-screen D-pad that synthesizes the same handling.
//
// Map:
//   Up/Down     -> bike mode / dock mode
//   Left/Right  -> cycle focus by bearing (or nudge offset in calibration)
//   Enter       -> open/close detail card on focused pin
//   c (harness) -> toggle calibration state (glasses entry point TBD on-device)
import { state, markActivity } from './state.js';
import { setCalibrationOffset } from './heading.js';
import { cycleFocus, toast } from './render.js';

export function handleKey(key) {
  markActivity();

  if (state.calibrating) {
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      state.calibrationOffset += key === 'ArrowLeft' ? -1 : 1;
      setCalibrationOffset(state.calibrationOffset);
      return;
    }
    if (key === 'Enter' || key === 'c') {
      state.calibrating = false;
      toast('CALIBRATION SAVED');
      return;
    }
    return;
  }

  switch (key) {
    case 'ArrowUp':
      if (state.mode !== 'bike') { state.mode = 'bike'; toast('BIKE MODE'); }
      break;
    case 'ArrowDown':
      if (state.mode !== 'dock') { state.mode = 'dock'; toast('DOCK MODE'); }
      break;
    case 'ArrowLeft':
      if (!state.detailOpen) cycleFocus(-1);
      break;
    case 'ArrowRight':
      if (!state.detailOpen) cycleFocus(1);
      break;
    case 'Enter':
      if (state.nearby.length) state.detailOpen = !state.detailOpen;
      break;
    case 'c': // dev harness only
      state.detailOpen = false;
      state.calibrating = true;
      toast('AIM AT A KNOWN STATION, NUDGE ◀▶');
      break;
  }
}

export function initInput({ showDpad }) {
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'c'].includes(e.key)) {
      e.preventDefault();
      handleKey(e.key);
    }
  });

  if (showDpad) {
    const dpad = document.getElementById('dpad');
    dpad.hidden = false;
    dpad.addEventListener('click', (e) => {
      const key = e.target.closest('button')?.dataset.key;
      if (key) handleKey(key);
    });
  }
}
