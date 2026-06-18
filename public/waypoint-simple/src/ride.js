// Ride timer + dual-tier price (simplification branch).
// Citibike bills per started minute, so cost steps on each minute boundary.
import { CONFIG } from './config.js';
import { state } from './state.js';

export function startRide() {
  state.ride.active = true;
  state.ride.startTs = Date.now();
}

export function stopRide() {
  state.ride.active = false;
  state.ride.startTs = 0;
}

export function isRiding() {
  return state.ride.active;
}

export function elapsedMs() {
  return state.ride.active ? Date.now() - state.ride.startTs : 0;
}

// Minutes billed: every started minute counts (ceil), min 1 once riding.
export function billedMinutes() {
  return Math.max(1, Math.ceil(elapsedMs() / 60000));
}

// Annual member: $/min, but capped at MEMBER_CAP through the cap window;
// minutes beyond the window resume accruing at the per-minute rate.
export function memberCost(min) {
  const { RATE_MEMBER, MEMBER_CAP, MEMBER_CAP_MINUTES } = CONFIG;
  if (min <= MEMBER_CAP_MINUTES) return Math.min(min * RATE_MEMBER, MEMBER_CAP);
  return MEMBER_CAP + (min - MEMBER_CAP_MINUTES) * RATE_MEMBER;
}

export function nonMemberCost(min) {
  return min * CONFIG.RATE_NONMEMBER;
}

export function fmtClock(ms) {
  const s = Math.floor(ms / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}
