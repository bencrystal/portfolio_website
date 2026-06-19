// Central mutable state. Sensor/data callbacks write; the rAF loop reads.
import { getCalibrationOffset } from './heading.js';

export const state = {
  // Three-phase flow driven by the single control:
  //   'idle'   -> only START RIDE shows; no timer, no markers
  //   'riding' -> timer/price running; button is FIND DOCKS; no markers yet
  //   'docks'  -> markers + top-right dock list visible; button is END RIDE
  phase: 'idle',
  calibrationOffset: getCalibrationOffset(),

  // Ride timer/price (started on START RIDE, stopped on END RIDE).
  ride: { active: false, startTs: 0 },

  // Heading
  displayHeading: null,    // rAF-interpolated, calibration applied at read time
  tiltBeta: 0,

  // GPS
  gps: { lat: null, lng: null, accuracy: null, ts: 0 },

  // Data
  waypoints: [],           // full joined Waypoint[] (all stations w/ status)
  nearby: [],              // 3 nearest docks w/ open spots (docks phase only); has .distance/.bearing
  lastFetchOk: 0,          // ts of last successful status fetch
  fetchFailing: false,

  // Idle detection (PRD §6.5)
  lastActivity: performance.now(),
};

export function markActivity() {
  state.lastActivity = performance.now();
}

export function isIdle(idleAfterMs) {
  return performance.now() - state.lastActivity > idleAfterMs;
}
