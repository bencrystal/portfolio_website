// Central mutable state. Sensor/data callbacks write; the rAF loop reads.
import { getCalibrationOffset } from './heading.js';

export const state = {
  mode: 'ebike',           // 'ebike' (searching) | 'dock' (active ride)
  calibrationOffset: getCalibrationOffset(),

  // Ride (single pinch toggles): ebike -> dock starts it, dock -> ebike stops it.
  ride: { active: false, startTs: 0 },

  // Heading
  displayHeading: null,    // rAF-interpolated, calibration applied at read time
  tiltBeta: 0,

  // GPS
  gps: { lat: null, lng: null, accuracy: null, ts: 0 },

  // Data
  waypoints: [],           // full joined Waypoint[] (all stations w/ status)
  nearby: [],              // 8 nearest for current mode, sorted by distance; has .distance/.bearing
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
