// Input (simplification): the only action is the pinch.
// On glasses the Neural Band / temple captouch pinch arrives as an `Enter`
// keydown (PRD §4.2); desktop Enter and a tap on the on-screen control match it.
//
//   pinch in ebike mode -> START ride  -> switch to dock mode, run timer
//   pinch in dock mode  -> STOP ride   -> back to ebike mode, clear timer
import { state, markActivity } from './state.js';
import { startRide, stopRide } from './ride.js';
import { toast } from './render.js';
import { toggleCamera } from './camera.js';

export function toggleRide() {
  markActivity();
  if (state.mode === 'ebike') {
    startRide();
    state.mode = 'dock';
    toast('RIDE STARTED — FIND A DOCK');
  } else {
    stopRide();
    state.mode = 'ebike';
    toast('RIDE ENDED');
  }
}

export function handleKey(key) {
  markActivity();
  if (key === 'Enter') toggleRide();
  else if (key === 'v') toggleCamera(); // dev harness only: camera passthrough
}

export function initInput() {
  window.addEventListener('keydown', (e) => {
    // Let the start screen's native button handle its own Enter.
    if (!document.getElementById('start-screen').hidden) return;
    if (e.key === 'Enter' || e.key === 'v') {
      e.preventDefault();
      handleKey(e.key);
    }
  });

  // The single on-screen control doubles as the tap target (harness; also a
  // visible affordance on glasses even though input there is the pinch).
  document.getElementById('control').addEventListener('click', toggleRide);
}
