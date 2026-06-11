// HUD renderer (PRD §5, §6.4, §7).
// rAF loop capped at 30fps. Per-frame: heading interpolation + pin transforms
// + ribbon redraw (compositor/canvas only). Text content updates at ~2Hz.
import { CONFIG } from './config.js';
import { state } from './state.js';
import { distanceM, bearingTo, normDelta, norm360 } from './geo.js';
import { interpToward } from './heading.js';

const HALF_FOV = CONFIG.H_FOV_DEG / 2;
const POOL_SIZE = 8; // max simultaneously visible pins; FOV fits far fewer

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
    'hud', 'pin-field', 'ribbon', 'status-mode', 'status-gps', 'gps-acc',
    'status-stale', 'status-age', 'calibration-banner', 'cal-offset',
    'detail-card', 'detail-name', 'detail-bikes', 'detail-ebikes',
    'detail-docks', 'detail-dist', 'detail-age', 'best-turn', 'chevron-left',
    'chevron-right', 'toast', 'debug-strip', 'dbg-raw', 'dbg-flt', 'dbg-gps',
    'dbg-rate', 'dbg-fetch',
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
export function recomputeNearby() {
  const { lat, lng } = state.gps;
  if (lat === null || !state.waypoints.length) {
    state.nearby = [];
    return;
  }
  const out = [];
  for (const w of state.waypoints) {
    const d = distanceM(lat, lng, w.lat, w.lng);
    if (d > CONFIG.RADIUS_M) continue;
    out.push({ ...w, distance: d, bearing: bearingTo(lat, lng, w.lat, w.lng) });
  }
  out.sort((a, b) => a.distance - b.distance);
  state.nearby = out.slice(0, CONFIG.MAX_STATIONS);

  if (state.nearby.length && !state.nearby.some((w) => w.id === state.focusedId)) {
    state.focusedId = state.nearby[0].id; // default focus: nearest
  }
}

// Cycle focus by bearing order across ALL nearby (ribbon ticks), PRD §5.4.
export function cycleFocus(dir) {
  if (!state.nearby.length) return;
  const byBearing = [...state.nearby].sort((a, b) => a.bearing - b.bearing);
  const i = byBearing.findIndex((w) => w.id === state.focusedId);
  const next = byBearing[(i + dir + byBearing.length) % byBearing.length];
  state.focusedId = next.id;
}

export function focusedWaypoint() {
  return state.nearby.find((w) => w.id === state.focusedId) ?? null;
}

// ---------- helpers ----------
function countFor(w) {
  if (state.mode === 'ebike') return w.meta.ebikes;
  return state.mode === 'bike' ? w.meta.bikes : w.meta.docks;
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
  // Nearest-first cap to pool size; keep default state sparse (PRD §7).
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
    const scale = (1.4 - 0.8 * t) * (w.id === state.focusedId ? 1.2 : 1);

    slot.el.style.display = '';
    slot.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(2)})`;
    slot.el.style.opacity = tiltFade;

    if (slot.stationId !== w.id) slot.stationId = w.id; // text refreshed at 2Hz
    slot.el.classList.toggle('focused', w.id === state.focusedId);
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

  // Station ticks (full 360° now fits)
  for (const w of state.nearby) {
    const d = normDelta(w.bearing - heading);
    const x = degToX(d);
    const n = countFor(w);
    const focused = w.id === state.focusedId;
    ctx.strokeStyle = stale ? '#5a5a5a'
      : n >= 5 ? '#2bff6f' : n >= 1 ? '#ffb52b' : '#ff4d4d';
    ctx.lineWidth = focused ? 4 : 2;
    const h = focused ? 24 : 14;
    ctx.beginPath();
    ctx.moveTo(x, MID + 8 - h);
    ctx.lineTo(x, MID + 8);
    ctx.stroke();
  }
}

// Nearest station with a healthy count for the current mode (>=3, falling
// back to >=1). state.nearby is already distance-sorted.
function bestWaypoint() {
  let fallback = null;
  for (const w of state.nearby) {
    const n = countFor(w);
    if (n >= CONFIG.BEST_MIN_COUNT) return w;
    if (n >= 1 && !fallback) fallback = w;
  }
  return fallback;
}

// "Turn this way for your best option" — double chevron under the ribbon,
// shown only when the best station is outside the FOV.
function drawBestTurn(heading) {
  const el = els['best-turn'];
  const w = bestWaypoint();
  if (!w || heading === null || state.detailOpen) { el.hidden = true; return; }
  const delta = normDelta(w.bearing - heading);
  if (Math.abs(delta) <= HALF_FOV + CONFIG.FOV_PAD_DEG) { el.hidden = true; return; }
  el.hidden = false;
  const deg = Math.round(Math.abs(delta));
  if (delta < 0) {
    el.textContent = `\u00AB ${deg}\u00B0 BEST`;
    el.style.left = '12px';
    el.style.right = 'auto';
  } else {
    el.textContent = `BEST ${deg}\u00B0 \u00BB`;
    el.style.right = '12px';
    el.style.left = 'auto';
  }
}

function drawChevrons(heading) {
  const w = focusedWaypoint() ?? state.nearby[0];
  let show = false, delta = 0;
  if (w && heading !== null) {
    delta = normDelta(w.bearing - heading);
    show = Math.abs(delta) > HALF_FOV + CONFIG.FOV_PAD_DEG && !state.detailOpen;
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

  els['status-mode'].textContent =
    state.mode === 'bike' ? 'BIKES' : state.mode === 'ebike' ? 'E-BIKES' : 'DOCKS';
  els['status-mode'].classList.toggle('ebike', state.mode === 'ebike');
  els['status-mode'].classList.toggle('dock', state.mode === 'dock');
  els['status-stale'].hidden = !stale;
  els['status-age'].textContent = state.lastFetchOk ? `data ${fmtAge(age)}` : 'loading…';

  const badGps = state.gps.accuracy !== null && state.gps.accuracy > CONFIG.GPS_BAD_ACCURACY_M;
  els['status-gps'].hidden = !badGps;
  if (badGps) els['gps-acc'].textContent = Math.round(state.gps.accuracy);

  els['calibration-banner'].hidden = !state.calibrating;
  els['cal-offset'].textContent = (state.calibrationOffset >= 0 ? '+' : '') +
    Math.round(state.calibrationOffset);

  refreshDetailCard();
  refreshPinText();

  // Debug strip
  if (!els['debug-strip'].hidden) {
    els['dbg-raw'].textContent = headingFilter.raw === null ? '–' : headingFilter.raw.toFixed(1);
    els['dbg-flt'].textContent = state.displayHeading === null ? '–' : effectiveHeading().toFixed(1);
    els['dbg-gps'].textContent = state.gps.accuracy === null ? '–' : `±${Math.round(state.gps.accuracy)}m`;
    els['dbg-rate'].textContent = headingFilter.eventRateHz().toFixed(0);
    els['dbg-fetch'].textContent = state.lastFetchOk ? Math.round(age / 1000) : '–';
  }
  return stale;
}

function refreshDetailCard() {
  els['detail-card'].hidden = !state.detailOpen;
  if (!state.detailOpen) return;
  const w = focusedWaypoint();
  if (!w) { state.detailOpen = false; els['detail-card'].hidden = true; return; }
  els['detail-name'].textContent = w.label;
  els['detail-bikes'].textContent = w.meta.bikes;
  els['detail-ebikes'].textContent = w.meta.ebikes;
  els['detail-docks'].textContent = w.meta.docks;
  els['detail-dist'].textContent = fmtDist(w.distance);
  els['detail-age'].textContent = state.lastFetchOk ? `${fmtAge(Date.now() - state.lastFetchOk)} old` : '–';
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
    drawBestTurn(heading);
  }
  requestAnimationFrame(frame);
}
