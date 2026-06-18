// HUD renderer (simplification branch).
// rAF loop capped at 30fps. Per-frame: heading interpolation + pin transforms
// + ribbon redraw. Text (counts, distances, ride readout) updates at ~2Hz.
//
// Only two modes: 'ebike' (find an e-bike) and 'dock' (riding, find a dock).
// No focus cycling, no detail card, no calibration UI — just the AR finding
// aids (pins + ribbon + edge chevrons), a single control, and the ride readout.
import { CONFIG } from './config.js';
import { state } from './state.js';
import { distanceM, bearingTo, normDelta, norm360 } from './geo.js';
import { interpToward } from './heading.js';
import { isRiding, elapsedMs, billedMinutes, memberCost, nonMemberCost, fmtClock } from './ride.js';

const HALF_FOV = CONFIG.H_FOV_DEG / 2;
const POOL_SIZE = 8; // matches MAX_STATIONS; FOV fits far fewer at once

const els = {};
const pinPool = [];
let ribbonCtx = null;
let headingFilter = null;
let viewW = CONFIG.VIEW_PX;  // measured; 600 on glasses, screen width on harness
let fieldH = 420;

export function measure() {
  const app = document.getElementById('app');
  viewW = app.clientWidth || CONFIG.VIEW_PX;
  fieldH = Math.max((app.clientHeight || CONFIG.VIEW_PX) - 120, 200);
  els['ribbon'].width = viewW; // canvas backing store must match
}

export function initRenderer(filter) {
  headingFilter = filter;
  for (const id of [
    'hud', 'pin-field', 'ribbon', 'mode-label', 'control', 'ride-readout',
    'chevron-left', 'chevron-right', 'toast',
    'debug-strip', 'dbg-raw', 'dbg-flt', 'dbg-gps', 'dbg-rate', 'dbg-fetch',
  ]) {
    els[id] = document.getElementById(id);
  }
  ribbonCtx = els['ribbon'].getContext('2d');
  measure();
  window.addEventListener('resize', measure);

  for (let i = 0; i < POOL_SIZE; i++) {
    const pin = document.createElement('div');
    pin.className = 'pin';
    pin.style.display = 'none';
    pin.innerHTML = `
      <div class="pin-glyph"><span class="pin-count"></span></div>
      <div class="pin-label"></div>
      <div class="pin-dist"></div>`;
    els['pin-field'].appendChild(pin);
    pinPool.push({
      el: pin,
      count: pin.querySelector('.pin-count'),
      label: pin.querySelector('.pin-label'),
      dist: pin.querySelector('.pin-dist'),
      stationId: null,
    });
  }
}

// ---------- nearby list (recomputed at text rate, not per frame) ----------
// Always the 8 nearest stations relevant to the current mode. No radius gate:
// "8 nearest" wins even when the area is sparse. Recompute runs every 500ms
// (2Hz) from the loop, so distances/bearings stay current as GPS moves.
export function recomputeNearby() {
  const { lat, lng } = state.gps;
  if (lat === null || !state.waypoints.length) {
    state.nearby = [];
    return;
  }
  const relevant = state.mode === 'ebike'
    ? (w) => w.meta.ebikes > 0
    : (w) => w.meta.docks > 0;

  const out = [];
  for (const w of state.waypoints) {
    if (!relevant(w)) continue;
    out.push({
      ...w,
      distance: distanceM(lat, lng, w.lat, w.lng),
      bearing: bearingTo(lat, lng, w.lat, w.lng),
    });
  }
  out.sort((a, b) => a.distance - b.distance);
  state.nearby = out.slice(0, CONFIG.MAX_STATIONS);
}

// ---------- helpers ----------
function countFor(w) {
  return state.mode === 'ebike' ? w.meta.ebikes : w.meta.docks;
}

function levelClass(n) {
  if (n >= 5) return 'lv-green';
  if (n >= 1) return 'lv-amber';
  return 'lv-red';
}

function fmtDist(m) {
  return `${Math.round(m / 5) * 5}m`;
}

function fmtAge(ms) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.round(s / 60)}m`;
}

function truncLabel(s) {
  return s.length > 18 ? s.slice(0, 17) + '…' : s;
}

function effectiveHeading() {
  return state.displayHeading === null
    ? null
    : norm360(state.displayHeading + state.calibrationOffset);
}

// ---------- per-frame ----------
function drawPins(heading, stale, tiltFade) {
  const visible = [];
  if (heading !== null) {
    for (const w of state.nearby) {
      const delta = normDelta(w.bearing - heading);
      if (Math.abs(delta) <= HALF_FOV + CONFIG.FOV_PAD_DEG) visible.push({ w, delta });
    }
  }
  // Nearest-first cap to pool size; keep the default state sparse (PRD §7).
  visible.sort((a, b) => a.w.distance - b.w.distance);
  const shown = visible.slice(0, POOL_SIZE);

  for (let i = 0; i < POOL_SIZE; i++) {
    const slot = pinPool[i];
    const item = shown[i];
    if (!item) {
      if (slot.stationId !== null) {
        slot.el.style.display = 'none';
        slot.stationId = null;
      }
      continue;
    }
    const { w, delta } = item;
    const x = viewW / 2 + (delta / HALF_FOV) * (viewW / 2);
    // Y band by distance: closer = lower & larger (PRD §5.1).
    const t = Math.min(w.distance / CONFIG.RADIUS_M, 1); // 0 near .. 1 far
    const y = 0.08 * fieldH + (1 - t) * 0.5 * fieldH;
    const scale = 1.4 - 0.8 * t;

    slot.el.style.display = '';
    slot.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(2)})`;
    slot.el.style.opacity = tiltFade;

    if (slot.stationId !== w.id) slot.stationId = w.id; // text refreshed at 2Hz
    slot.el.classList.toggle('stale', stale);
  }
}

function refreshPinText() {
  for (const slot of pinPool) {
    if (slot.stationId === null) continue;
    const w = state.nearby.find((n) => n.id === slot.stationId);
    if (!w) continue;
    const n = countFor(w);
    slot.count.textContent = n;
    slot.label.textContent = truncLabel(w.label);
    slot.dist.textContent = fmtDist(w.distance);
    slot.el.classList.remove('lv-green', 'lv-amber', 'lv-red');
    slot.el.classList.add(levelClass(n));
  }
}

function drawRibbon(heading, stale) {
  const ctx = ribbonCtx;
  const W = viewW, H = 60, MID = 36;
  ctx.clearRect(0, 0, W, H);
  if (heading === null) return;

  // Fisheye mapping over the full 360°: degrees near gaze get more pixels,
  // behind-you compresses toward the edges (still ordered, still glanceable).
  const degToX = (delta) => {
    const t = Math.pow(Math.abs(delta) / 180, CONFIG.RIBBON_GAMMA);
    return W / 2 + Math.sign(delta) * (W / 2 - 8) * t;
  };

  // FOV window highlight
  ctx.fillStyle = 'rgba(43, 233, 255, 0.18)';
  const x0 = degToX(-HALF_FOV), x1 = degToX(HALF_FOV);
  ctx.fillRect(x0, 8, x1 - x0, MID);
  ctx.strokeStyle = 'rgba(43, 233, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, 8, x1 - x0, MID);

  // Cardinal labels
  ctx.fillStyle = '#9aa0a6';
  ctx.font = '14px -apple-system, sans-serif';
  ctx.textAlign = 'center';
  for (const [deg, name] of [[0, 'N'], [90, 'E'], [180, 'S'], [270, 'W']]) {
    ctx.fillText(name, degToX(normDelta(deg - heading)), 56);
  }

  // Station ticks (full 360°). Height encodes distance (closer = taller);
  // color stays availability.
  for (const w of state.nearby) {
    const d = normDelta(w.bearing - heading);
    const x = degToX(d);
    const n = countFor(w);
    const closeness = 1 - Math.min(w.distance / CONFIG.RADIUS_M, 1);
    const h = 10 + closeness * 22;
    ctx.strokeStyle = stale ? '#5a5a5a'
      : n >= 5 ? '#2bff6f' : n >= 1 ? '#ffb52b' : '#ff4d4d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, MID + 8 - h);
    ctx.lineTo(x, MID + 8);
    ctx.stroke();
  }
}

// Edge chevron pointing toward the nearest relevant station when it's outside
// the FOV — so you know which way to turn to find your e-bike / dock.
function drawChevrons(heading) {
  const w = state.nearby[0];
  let show = false, delta = 0;
  if (w && heading !== null) {
    delta = normDelta(w.bearing - heading);
    show = Math.abs(delta) > HALF_FOV + CONFIG.FOV_PAD_DEG;
  }
  els['chevron-left'].hidden = !(show && delta < 0);
  els['chevron-right'].hidden = !(show && delta > 0);
  if (show) {
    const deg = `${Math.round(Math.abs(delta))}°`;
    (delta < 0 ? els['chevron-left'] : els['chevron-right'])
      .querySelector('.chev-deg').textContent = deg;
  }
}

// ---------- slow (2Hz) updates ----------
function refreshChrome() {
  const now = Date.now();
  const age = state.lastFetchOk ? now - state.lastFetchOk : Infinity;
  const stale = age > CONFIG.STALE_AFTER_MS;

  // What's on screen + what the single control does next.
  if (state.mode === 'ebike') {
    els['mode-label'].textContent = 'DISPLAYING E-BIKES';
    els['control'].textContent = 'START RIDE';
    els['control'].classList.remove('riding');
  } else {
    els['mode-label'].textContent = 'DISPLAYING DOCKS';
    els['control'].textContent = 'END RIDE';
    els['control'].classList.add('riding');
  }

  // Ride readout: rate hint while searching; live dual-tier cost while riding.
  if (isRiding()) {
    const min = billedMinutes();
    const mem = memberCost(min).toFixed(2);
    const non = nonMemberCost(min).toFixed(2);
    els['ride-readout'].textContent = `${fmtClock(elapsedMs())}  ·  mem$${mem} / non$${non}`;
  } else {
    const m = CONFIG.RATE_MEMBER.toFixed(2);
    const n = CONFIG.RATE_NONMEMBER.toFixed(2);
    els['ride-readout'].textContent = `mem $${m} / non $${n} per min`;
  }

  refreshPinText();

  // Debug strip (harness only)
  if (!els['debug-strip'].hidden) {
    els['dbg-raw'].textContent = headingFilter.raw === null ? '–' : headingFilter.raw.toFixed(1);
    els['dbg-flt'].textContent = state.displayHeading === null ? '–' : effectiveHeading().toFixed(1);
    els['dbg-gps'].textContent = state.gps.accuracy === null ? '–' : `±${Math.round(state.gps.accuracy)}m`;
    els['dbg-rate'].textContent = headingFilter.eventRateHz().toFixed(0);
    els['dbg-fetch'].textContent = state.lastFetchOk ? Math.round(age / 1000) : '–';
  }
  return stale;
}

let toastTimer = null;
export function toast(msg, ms = 2500) {
  els['toast'].textContent = msg;
  els['toast'].hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { els['toast'].hidden = true; }, ms);
}

// ---------- main loop ----------
export function startLoop() {
  const frameInterval = 1000 / CONFIG.TARGET_FPS;
  const textInterval = 1000 / CONFIG.TEXT_UPDATE_HZ;
  let lastFrame = 0;
  let lastText = 0;
  let stale = true;
  let lastHeadingForIdle = null;

  function frame(now) {
    requestAnimationFrame(frame);
    if (now - lastFrame < frameInterval) return; // cap at 30fps
    lastFrame = now;

    // Interpolate display heading toward smoothed target (shortest arc).
    if (headingFilter.smoothed !== null) {
      state.displayHeading = interpToward(
        state.displayHeading, headingFilter.smoothed, CONFIG.INTERP_FACTOR);
    }

    if (now - lastText >= textInterval) {
      lastText = now;
      recomputeNearby();
      stale = refreshChrome();
      // Idle detection: heading swing > 2° counts as activity.
      if (state.displayHeading !== null) {
        if (lastHeadingForIdle === null ||
            Math.abs(normDelta(state.displayHeading - lastHeadingForIdle)) > 2) {
          state.lastActivity = performance.now();
          lastHeadingForIdle = state.displayHeading;
        }
      }
    }

    const heading = effectiveHeading();
    // Tilt gating (P1): fade pins when looking down past threshold.
    const tiltFade = state.tiltBeta < -CONFIG.TILT_FADE_BETA ||
      state.tiltBeta > 180 - CONFIG.TILT_FADE_BETA ? '0.15' : '1';

    drawPins(heading, stale, tiltFade);
    drawRibbon(heading, stale);
    drawChevrons(heading);
  }
  requestAnimationFrame(frame);
}
