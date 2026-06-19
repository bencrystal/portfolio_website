// HUD renderer (dock-only branch).
// rAF loop capped at 30fps. Per-frame: heading interpolation + pin transforms.
// Text (dock list, ride readout) updates at ~2Hz.
//
// No compass ribbon. Three-phase flow: dock markers + top-right dock list only
// appear in the 'docks' phase. Best (nearest) dock is green, the other two
// amber. Single control drives idle -> riding -> docks.
import { CONFIG } from './config.js';
import { state } from './state.js';
import { distanceM, bearingTo, normDelta, norm360 } from './geo.js';
import { interpToward } from './heading.js';
import { isRiding, elapsedMs, billedMinutes, memberCost, nonMemberCost, fmtClock } from './ride.js';

const HALF_FOV = CONFIG.H_FOV_DEG / 2;
const POOL_SIZE = CONFIG.DOCK_COUNT; // only the 3 nearest docks ever render

const els = {};
const pinPool = [];
let headingFilter = null;
let viewW = CONFIG.VIEW_PX;  // measured; 600 on glasses, screen width on harness
let fieldH = 420;

export function measure() {
  const app = document.getElementById('app');
  viewW = app.clientWidth || CONFIG.VIEW_PX;
  fieldH = Math.max((app.clientHeight || CONFIG.VIEW_PX) - 120, 200);
}

export function initRenderer(filter) {
  headingFilter = filter;
  for (const id of [
    'hud', 'pin-field', 'dock-list', 'control', 'ride-readout',
    'chevron-left', 'chevron-right', 'toast',
    'debug-strip', 'dbg-raw', 'dbg-flt', 'dbg-gps', 'dbg-rate', 'dbg-fetch',
  ]) {
    els[id] = document.getElementById(id);
  }
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
// The 3 nearest docks that have at least one open spot — but only while in the
// 'docks' phase (markers stay hidden until FIND DOCKS is pressed). Recompute
// runs every 500ms (2Hz) from the loop, so the list stays live as GPS moves.
export function recomputeNearby() {
  const { lat, lng } = state.gps;
  if (state.phase !== 'docks' || lat === null || !state.waypoints.length) {
    state.nearby = [];
    return;
  }

  const out = [];
  for (const w of state.waypoints) {
    if (w.meta.docks <= 0) continue; // need at least one open spot
    out.push({
      ...w,
      distance: distanceM(lat, lng, w.lat, w.lng),
      bearing: bearingTo(lat, lng, w.lat, w.lng),
    });
  }
  out.sort((a, b) => a.distance - b.distance);
  state.nearby = out.slice(0, CONFIG.DOCK_COUNT);
}

// ---------- helpers ----------
// Best dock (nearest, index 0) is green; the other two are amber/yellow.
function rankClass(idx) {
  return idx === 0 ? 'lv-green' : 'lv-amber';
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

// Compress an intersection-style GBFS station name for the narrow pin label,
// e.g. "Central Park West & W 76 St" -> "Ctl Pk W & W 76", "Broadway & W 52 St"
// -> "Bway & W 52". Rule-based (not a hardcoded table) so it covers every
// station and survives renames. Full names still live in the top-right list.
const ABBR = [
  [/\bCentral Park West\b/gi, 'Ctl Pk W'],
  [/\bCentral Park North\b/gi, 'Ctl Pk N'],
  [/\bCentral Park South\b/gi, 'Ctl Pk S'],
  [/\bBroadway\b/gi, 'Bway'],
  [/\bAvenue\b/gi, 'Av'],
  [/\bAve\b/gi, 'Av'],
  [/\bBoulevard\b/gi, 'Blvd'],
  [/\bParkway\b/gi, 'Pkwy'],
  [/\bTerrace\b/gi, 'Ter'],
  [/\bPlaza\b/gi, 'Plz'],
  [/\bPlace\b/gi, 'Pl'],
  [/\bSquare\b/gi, 'Sq'],
  // Drop "St"/"Street" only after a number ("W 52 St" -> "W 52"); leaves
  // "St Marks Pl" (Saint) and other words intact.
  [/(\d+)\s+St(?:reet)?\b/gi, '$1'],
];
function abbrevLabel(name) {
  let s = name;
  for (const [re, to] of ABBR) s = s.replace(re, to);
  s = s.replace(/\s+/g, ' ').replace(/\s+&/g, ' &').trim();
  return truncLabel(s);
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
    const idx = state.nearby.findIndex((n) => n.id === slot.stationId);
    if (idx < 0) continue;
    const w = state.nearby[idx];
    slot.count.textContent = w.meta.docks; // open dock spots
    slot.label.textContent = abbrevLabel(w.label);
    slot.dist.textContent = fmtDist(w.distance);
    slot.el.classList.remove('lv-green', 'lv-amber', 'lv-red');
    slot.el.classList.add(rankClass(idx));
  }
}

// Top-right text list: the 3 nearest open docks by distance, names + open
// spots. Best (nearest) row is green; the others amber. Built with text nodes
// so live station names can't inject markup.
function refreshDockList() {
  const list = els['dock-list'];
  if (state.phase !== 'docks' || !state.nearby.length) {
    list.hidden = true;
    list.replaceChildren();
    return;
  }
  list.hidden = false;
  const rows = state.nearby.map((w, i) => {
    const row = document.createElement('div');
    row.className = 'dock-row ' + (i === 0 ? 'best' : 'alt');
    row.textContent = `${w.label} · ${w.meta.docks} open`;
    return row;
  });
  list.replaceChildren(...rows);
}

// Edge chevron pointing toward the nearest (best) dock when it's outside
// the FOV — so you know which way to turn to find it.
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

  // What the single control does next, by phase.
  if (state.phase === 'idle') {
    els['control'].textContent = 'START RIDE';
    els['control'].classList.remove('riding');
  } else if (state.phase === 'riding') {
    els['control'].textContent = 'FIND DOCKS';
    els['control'].classList.add('riding');
  } else {
    els['control'].textContent = 'END RIDE';
    els['control'].classList.add('riding');
  }

  // Ride readout: rate hint before the ride; live dual-tier cost while riding.
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
  refreshDockList();

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
    drawChevrons(heading);
  }
  requestAnimationFrame(frame);
}
