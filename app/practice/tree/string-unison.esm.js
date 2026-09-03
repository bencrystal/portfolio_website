/*!
 * string-unison.js — a celebration overlay for finishing a batch of exercises.
 *
 * Dozens of "strings" scatter across the screen, each vibrating at its own
 * inharmonic frequency. They swing into alignment, their oscillators pull each
 * other into phase (a Kuramoto-style lock), and they superpose into a single
 * bright standing wave — the fundamental — with its overtone series blooming
 * faintly around it. Holds until tap.
 *
 * No dependencies. Plain Canvas 2D, so it drops into any web app and runs
 * unchanged inside a WebView if the app goes native.
 *
 *   import StringUnison from './string-unison.esm.js';
 *   StringUnison.play({ accent: '#f4c26b', label: 'Batch complete', onDismiss })
 */
const StringUnison = (function () {
  'use strict';

  var TAU = Math.PI * 2;

  var DEFAULTS = {
    strings: 48,                 // how many voices
    accent: '#f4c26b',           // the colour everything resolves to
    background: '#07060d',       // pass your app's background here
    chaosHue: [200, 290],        // hue range of the dissonant strings (blue → violet)
    label: 'Batch complete',     // set '' to hide
    sublabel: 'Tap to continue', // set '' to hide
    speed: 1,                    // >1 shortens the build
    seed: null,                  // number → deterministic layout
    zIndex: 9999,
    tapDuringBuild: 'skip',      // 'skip' fast-forwards to unity, 'dismiss' closes
    respectReducedMotion: true,
    onUnity: null,               // fires when the wave locks
    onDismiss: null              // fires after the fade-out
  };

  // Timeline, in seconds of build-time (scaled by `speed`).
  var T = {
    appearDur: 0.7,   // each string draws itself on
    alignStart: 2.0,  // strings begin sweeping toward the centre line
    alignDur: 2.3,
    lockStart: 3.3,   // frequencies glide and phases pull together
    lockDur: 1.9
  };

  // ---------- small utils ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function smooth(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  function easeInOutCubic(x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeInCubic(x) { x = clamp01(x); return x * x * x; }
  function easeOutCubic(x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); }
  function taper(q) { // q in [-0.5, 0.5]; fixed-end window so every string dies at its ends
    var e = 0.5 - Math.abs(q), m = 0.13;
    if (e >= m) return 1;
    var v = e / m; return v * v * (3 - 2 * v);
  }

  function hexToRgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, h = 0, s = 0;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    h = (((h % 360) + 360) % 360) / 360;
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    function f(t) {
      t = ((t % 1) + 1) % 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  function rgba(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + a + ')'; }

  // ---------- scene ----------
  function createScene(opts) {
    var o = Object.assign({}, DEFAULTS, opts || {});
    var rng = mulberry32(o.seed == null ? (Math.random() * 2147483647) | 0 : o.seed);
    var accRgb = hexToRgb(o.accent), accHsl = rgbToHsl(accRgb);
    var strings = [], maxDF = 0;

    for (var i = 0; i < o.strings; i++) {
      var hue0 = lerp(o.chaosHue[0], o.chaosHue[1], rng());
      var dh = accHsl[0] - hue0; dh = ((dh + 540) % 360) - 180;   // shortest way round the wheel
      var dF = rng() * 0.6; if (dF > maxDF) maxDF = dF;
      strings.push({
        cxn: 0.08 + 0.84 * rng(), cyn: 0.08 + 0.84 * rng(),     // chaos centre, normalised
        ang0: (rng() - 0.5) * Math.PI * 0.95,                   // chaos angle
        lenn: 0.55 + 0.9 * rng(),                               // × diagonal
        ampn: 0.02 + 0.07 * rng(),                              // × min(W,H)
        hw0: 2 + rng() * 7,        // half-waves along the string; non-integer → inharmonic
        psi0: (rng() - 0.5) * TAU, // spatial phase (resolves to π/2: one cosine bulge)
        w0: TAU * (0.7 + 1.7 * rng()), // rad/s — 0.7 to 2.4 Hz, no two alike
        theta: rng() * TAU,        // temporal phase; integrated every frame
        hue0: hue0, dh: dh, sat0: 0.5 + 0.25 * rng(), lit0: 0.6 + 0.18 * rng(),
        j1: rng() * TAU, j2: rng() * TAU, j3: 0.5 + rng() * 0.9,
        appear: rng() * 1.3, dA: rng() * 0.7, dF: dF,
        wcore: 0.9 + rng() * 0.6,
        rev: rng() < 0.5 ? 1 : -1,
        uA: 0, uF: 0
      });
    }

    var hotRgb = [lerp(accRgb[0], 255, 0.5), lerp(accRgb[1], 255, 0.5), lerp(accRgb[2], 255, 0.5)];
    var deepRgb = hslToRgb(accHsl[0], Math.min(1, accHsl[1] + 0.1), Math.max(0.2, accHsl[2] - 0.16));
    return {
      opts: o, strings: strings,
      accRgb: accRgb, accHsl: accHsl, hotRgb: hotRgb, deepRgb: deepRgb,
      w1: TAU * 0.55,            // the fundamental: a slow, deliberate 0.55 Hz
      phi1: 0, theta0: 0,
      time: 0, tl: 0,            // wall clock (oscillators) / build clock (timeline)
      speed: o.speed, fastForward: false, reduced: false,
      tLock: T.lockStart + maxDF + T.lockDur,
      unityFired: false
    };
  }

  // Advance oscillators and timeline by dt seconds.
  function step(scene, dt) {
    if (dt > 0.05) dt = 0.05;
    var th0 = scene.theta0;   // reference phase at the old time, so a locked string has zero lag
    scene.time += dt;
    if (scene.fastForward && scene.tl >= scene.tLock) scene.fastForward = false;
    scene.tl += dt * scene.speed * (scene.fastForward ? 4 : 1);

    var S = scene.strings, tl = scene.tl;
    for (var i = 0; i < S.length; i++) {
      var s = S[i];
      s.uA = easeInOutCubic((tl - (T.alignStart + s.dA)) / T.alignDur);
      s.uF = easeInCubic((tl - (T.lockStart + s.dF)) / T.lockDur);
      // frequency glides toward the fundamental while a coupling term pulls the
      // phase onto the shared oscillator — free-running at uF=0, locked at uF=1.
      var w = lerp(s.w0, scene.w1, s.uF);
      var kappa = 14 * s.uF * s.uF;
      s.theta = (s.theta + (w + kappa * Math.sin(th0 - s.theta)) * dt) % TAU;
    }
    scene.theta0 = (scene.w1 * scene.time + scene.phi1) % TAU;
    if (!scene.unityFired && tl >= scene.tLock) {
      scene.unityFired = true;
      if (typeof scene.opts.onUnity === 'function') scene.opts.onUnity();
    }
  }

  // Trace the fundamental — one cosine bulge spanning the screen — into the current path.
  function tracePath(ctx, W, H, len1, amp, tempo) {
    ctx.beginPath();
    for (var j = 0; j <= 120; j++) {
      var q = j / 120 - 0.5, x = W / 2 + q * len1, y = H / 2 + amp * taper(q) * Math.cos(Math.PI * q) * tempo;
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  }

  // Paint one frame into a 2D context of CSS size W×H.
  function draw(ctx, scene, W, H) {
    var o = scene.opts, S = scene.strings, tl = scene.tl, time = scene.time;
    var diag = Math.hypot(W, H), m = Math.min(W, H);
    var post = tl - scene.tLock;                                   // seconds since unity
    var swell = post < 0 ? smooth(1 + post / 1.1) : Math.exp(-post / 0.9); // crescendo into the lock
    var flash = post < 0 ? smooth(1 + post / 0.3) : Math.exp(-post / 0.7);  // the bloom itself
    var gain = 1 + 0.45 * swell;
    var breathe = post < 0 ? 0.78 + 0.22 * swell : 0.88 + 0.12 * Math.cos(TAU * post / 5.5);
    var amp1 = Math.min(W * 0.22, H * 0.2) * breathe;
    var len1 = W + 6;
    var jitterOn = scene.reduced ? 0 : 1;
    var lock = 0, i, s;
    for (i = 0; i < S.length; i++) lock += S[i].uF;
    lock = smooth(lock / S.length);                                 // how much of the ensemble has locked
    var acc = scene.accRgb, hot = scene.hotRgb, deep = scene.deepRgb;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = o.background;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // light thrown by the wave: a soft band above and below the centre line
    var band = 0.025 * lock + 0.11 * flash;
    if (band > 0.003) {
      var reach = amp1 * 2.4 + 40;
      var lg = ctx.createLinearGradient(0, H / 2 - reach, 0, H / 2 + reach);
      lg.addColorStop(0, rgba(deep, 0)); lg.addColorStop(0.5, rgba(deep, band)); lg.addColorStop(1, rgba(deep, 0));
      ctx.fillStyle = lg;
      ctx.fillRect(0, H / 2 - reach, W, reach * 2);
    }

    for (i = 0; i < S.length; i++) {
      s = S[i];
      var vis = easeOutCubic((tl - s.appear) / T.appearDur);
      if (vis <= 0) continue;
      var uA = s.uA, uF = s.uF, chaos = (1 - uA) * jitterOn, loose = (1 - uF) * jitterOn;

      // geometry: drift and wobble while loose, then sweep to the centre line
      var cx = lerp(W * s.cxn, W / 2, uA) + chaos * 0.03 * m * Math.sin(time * 0.6 + s.j2);
      var cy = lerp(H * s.cyn, H / 2, uA) + chaos * 0.03 * m * Math.cos(time * 0.5 + s.j1);
      var ang = lerp(s.ang0, 0, uA) + chaos * 0.05 * Math.sin(time * 0.8 + s.j1);
      var len = lerp(diag * s.lenn, len1, uA);
      var k = lerp(Math.PI * s.hw0 / len, Math.PI / len, uF);
      var psi = lerp(s.psi0, Math.PI / 2, uF);
      var amp = lerp(m * s.ampn * (1 + 0.5 * swell), amp1, uF);
      var tempo = Math.sin(s.theta);
      var jitAmp = loose * amp * 0.35, jitK = k * 2.618, jitT = time * s.j3 * 5 + s.j1;
      var jitEnv = Math.sin(time * 1.3 + s.j2);

      // colour: cold and scattered → one warm note
      var uC = smooth(uF);
      var col = hslToRgb(s.hue0 + s.dh * uC, lerp(s.sat0, scene.accHsl[1], uC), lerp(s.lit0, scene.accHsl[2], uC));
      var fade = Math.min(1, vis * 3);
      var aCore = Math.min(1, lerp(lerp(0.55, 0.25, uA), 0.03, uF) * gain * fade);
      var aHalo = lerp(lerp(0.08, 0.04, uA), 0, uF) * gain * fade;

      var N = Math.max(60, Math.min(180, (len / 6) | 0));
      var reveal = Math.round(N * vis);
      var j0 = s.rev > 0 ? 0 : N - reveal, jEnd = s.rev > 0 ? reveal : N;
      var ca = Math.cos(ang), sa = Math.sin(ang);

      ctx.beginPath();
      for (var j = j0; j <= jEnd; j++) {
        var q = j / N - 0.5, x = q * len;
        var y = amp * taper(q) * Math.sin(k * x + psi) * tempo;
        if (jitAmp > 0.001) y += jitAmp * taper(q) * Math.sin(jitK * x + jitT) * jitEnv;
        var px = cx + x * ca - y * sa, py = cy + x * sa + y * ca;
        if (j === j0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      if (aHalo > 0.002) { ctx.strokeStyle = rgba(col, aHalo); ctx.lineWidth = 7; ctx.stroke(); }
      ctx.strokeStyle = rgba(col, aCore); ctx.lineWidth = s.wcore; ctx.stroke();
    }

    // the unified wave: a graded halo that emerges as the voices lock, and flares at the moment of unity
    var glow = 1.35 * lock + 0.7 * flash;
    if (glow > 0.003) {
      var t0 = Math.sin(scene.theta0), spread = 1 + 1.3 * flash;
      tracePath(ctx, W, H, len1, amp1, t0);
      for (i = 17; i >= 0; i--) {              // wide and faint first, hot core last
        var f = i / 17, cw = f < 0.3 ? 0 : (f - 0.3) / 0.7;
        var c = [lerp(hot[0], deep[0], cw), lerp(hot[1], deep[1], cw), lerp(hot[2], deep[2], cw)];
        ctx.strokeStyle = rgba(c, Math.min(1, (0.16 * Math.pow(1 - f, 2.8) + 0.003) * glow));
        ctx.lineWidth = (2.5 + 110 * Math.pow(f, 1.8)) * spread;
        ctx.stroke();
      }
    }

    // consonance: the overtone series surfaces faintly out of the fundamental
    if (post > 0.4) {
      var ov = smooth((post - 0.4) / 1.8);
      for (var n = 2; n <= 4; n++) {
        var an = ov * 0.14 / (n - 0.6), ampN = amp1 * 0.5 / n, tn = Math.sin(scene.theta0 + n * 0.9);
        ctx.beginPath();
        for (var jk = 0; jk <= 140; jk++) {
          var qn = jk / 140 - 0.5, xn = W / 2 + qn * len1;
          var yn = H / 2 + ampN * taper(qn) * Math.sin(n * Math.PI * (qn + 0.5)) * tn;
          if (jk === 0) ctx.moveTo(xn, yn); else ctx.lineTo(xn, yn);
        }
        ctx.strokeStyle = rgba(acc, an); ctx.lineWidth = 1.6; ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // ---------- browser overlay ----------
  function play(userOpts) {
    var o = Object.assign({}, DEFAULTS, userOpts || {});
    var reduced = o.respectReducedMotion && typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) o.speed = o.speed * 2.5;
    var scene = createScene(o);
    scene.reduced = !!reduced;

    var host = document.createElement('div');
    host.setAttribute('role', 'dialog');
    host.setAttribute('aria-label', o.label || 'Celebration');
    host.tabIndex = 0;
    host.style.cssText = 'position:fixed;inset:0;z-index:' + o.zIndex + ';background:' + o.background +
      ';opacity:0;transition:opacity .45s ease;cursor:pointer;overflow:hidden;touch-action:manipulation;' +
      '-webkit-tap-highlight-color:transparent;outline:none;';

    var canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    host.appendChild(canvas);

    var textCss = 'position:absolute;left:0;right:0;text-align:center;font-family:inherit;' +
      'pointer-events:none;opacity:0;transition:opacity 1.4s ease;padding:0 24px;';
    var label = document.createElement('div');
    label.style.cssText = textCss + 'font-weight:300;font-size:22px;letter-spacing:.03em;color:' + o.accent + ';';
    label.textContent = o.label || '';
    var sub = document.createElement('div');
    sub.style.cssText = textCss + 'font-weight:400;font-size:13px;letter-spacing:.08em;color:rgba(255,255,255,.42);';
    sub.textContent = o.sublabel || '';
    host.appendChild(label);
    host.appendChild(sub);
    document.body.appendChild(host);
    host.focus({ preventScroll: true });
    requestAnimationFrame(function () { host.style.opacity = '1'; });

    var ctx = canvas.getContext('2d'), W = 0, H = 0;
    function fit() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = host.clientWidth; H = host.clientHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var top = H / 2 + Math.min(W * 0.22, H * 0.2) + 52;
      label.style.top = top + 'px';
      sub.style.top = (top + 40) + 'px';
    }
    fit();

    var raf = 0, last = 0, done = false, labelOn = false, subOn = false;
    function frame(now) {
      if (done) return;
      var dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      step(scene, dt);
      draw(ctx, scene, W, H);
      var post = scene.tl - scene.tLock;
      if (!labelOn && post > 0.9) { labelOn = true; label.style.opacity = '1'; }
      if (!subOn && post > 2.4) { subOn = true; sub.style.opacity = '1'; }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onVisibility() {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf && !done) { last = 0; raf = requestAnimationFrame(frame); }
    }
    function dismiss() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', fit);
      document.removeEventListener('visibilitychange', onVisibility);
      host.style.opacity = '0';
      setTimeout(function () {
        if (host.parentNode) host.parentNode.removeChild(host);
        if (typeof o.onDismiss === 'function') o.onDismiss();
      }, 480);
    }
    function onTap() {
      if (scene.tl < scene.tLock) {
        if (o.tapDuringBuild === 'dismiss') dismiss(); else scene.fastForward = true;
      } else dismiss();
    }
    host.addEventListener('click', onTap);
    host.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); onTap(); }
    });
    window.addEventListener('resize', fit);
    document.addEventListener('visibilitychange', onVisibility);

    return { dismiss: dismiss, scene: scene, canvas: canvas, element: host };
  }

  return { play: play, createScene: createScene, step: step, draw: draw, defaults: DEFAULTS, timeline: T };
})();

export default StringUnison;
export const { play, createScene, step, draw } = StringUnison;
