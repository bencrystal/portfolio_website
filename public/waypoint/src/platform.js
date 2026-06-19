// Platform shim (PRD §6.2 gotcha): hides heading-reference differences
// between the glasses runtime, iOS Safari, and other browsers.
//
// - Glasses: e.alpha IS compass heading (0–360, clockwise) per Meta docs.
// - iOS Safari: e.alpha is arbitrary-reference; use e.webkitCompassHeading
//   (clockwise from north).
// - Android/desktop (deviceorientationabsolute): alpha is degrees
//   COUNTERclockwise from north => heading = 360 - alpha.

// ASSUMPTION: glasses runtime UA is detectable; adjust the regex after the
// first on-device probe (PRD §10.1). The mrbd meta tag implies a dedicated UA.
export const isGlasses = /\b(MRBD|Meta Wearable|RayBan|Ray-Ban)\b/i.test(navigator.userAgent);

export const isTouch = !isGlasses && ('ontouchstart' in window);

export function getHeading(e) {
  // Glasses report W3C alpha (counterclockwise from north), NOT a ready-made
  // compass heading — verified on-device: without this conversion, head
  // rotation revolves the pins the wrong way. Convert to clockwise like the
  // other non-iOS paths below.
  if (isGlasses) return typeof e.alpha === 'number' ? (360 - e.alpha) % 360 : null;
  if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0) {
    return e.webkitCompassHeading; // iOS, clockwise from north
  }
  if (e.absolute && typeof e.alpha === 'number') {
    return 360 - e.alpha; // w3c absolute alpha is counterclockwise
  }
  if (typeof e.alpha === 'number') return 360 - e.alpha; // best effort (desktop dev)
  return null;
}

// Prefer the absolute event stream where available.
export function orientationEventName() {
  return 'ondeviceorientationabsolute' in window
    ? 'deviceorientationabsolute'
    : 'deviceorientation';
}

// Must be called from a user gesture (Enter on the start button).
// Glasses runtime auto-grants; iOS needs the explicit requestPermission flow.
export async function requestSensorPermission() {
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      const r = await DeviceOrientationEvent.requestPermission();
      return r === 'granted';
    }
    return true;
  } catch {
    return false;
  }
}

export function watchLocation(onFix, onError) {
  if (!('geolocation' in navigator)) {
    onError(new Error('geolocation unavailable'));
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(onFix, onError, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 5000,
  });
  return () => navigator.geolocation.clearWatch(id);
}
