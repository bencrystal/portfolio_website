// Input (dock-only): the only action is the pinch, which advances a 3-phase flow.
// On glasses the Neural Band / temple captouch pinch arrives as an `Enter`
// keydown (PRD §4.2); desktop Enter and a tap on the on-screen control match it.
//
//   idle   -> START RIDE : start timer/price, go to 'riding'
//   riding -> FIND DOCKS : reveal dock markers + list, go to 'docks'
//   docks  -> END RIDE   : stop timer/price, back to 'idle'
import { state, markActivity } from './state.js';
import { startRide, stopRide } from './ride.js';
import { toast } from './render.js';
import { toggleCamera } from './camera.js';

export function advance() {
  markActivity();
  if (state.phase === 'idle') {
    startRide();
    state.phase = 'riding';
    toast('RIDE STARTED');
  } else if (state.phase === 'riding') {
    state.phase = 'docks';
    toast('FINDING DOCKS');
  } else {
    stopRide();
    state.phase = 'idle';
    toast('RIDE ENDED');
  }
}

export function handleKey(key) {
  markActivity();
  if (key === 'Enter') advance();
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
  document.getElementById('control').addEventListener('click', advance);
}
