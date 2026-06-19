// Tunables — PRD §4, §6. Verify FOV + smoothing alpha on device (M1).
export const CONFIG = {
  VIEW_PX: 600,
  H_FOV_DEG: 14.1,        // horizontal FOV, degrees (PRD §4.1)
  FOV_PAD_DEG: 2,         // pins ease in/out slightly beyond the edge
  PIN_FIELD_TOP: 60,      // px
  PIN_FIELD_HEIGHT: 420,

  RADIUS_M: 500,          // staleness/accuracy hints + pin distance scaling
  DOCK_COUNT: 3,          // dock-only: show just the 3 nearest docks w/ open spots

  // Ride pricing (PRD simplification). Both tiers shown side by side.
  RATE_MEMBER: 0.27,        // $/min, annual member
  RATE_NONMEMBER: 0.41,     // $/min, single ride / day pass
  MEMBER_CAP: 5.40,         // $ cap for member rides <= cap window (Manhattan assumed)
  MEMBER_CAP_MINUTES: 45,   // cap applies to the first 45 min; overage resumes $/min

  SMOOTH_ALPHA: 0.2,      // exponential smoothing on raw heading (tune 0.15–0.3)
  INTERP_FACTOR: 0.25,    // per-frame shortest-arc interpolation toward smoothed
  TILT_FADE_BETA: 30,     // fade pins when looking down past this (deg), P1

  TARGET_FPS: 30,         // glasses content refresh
  TEXT_UPDATE_HZ: 2,      // counts/distances/ribbon labels

  STATUS_POLL_MS: 30_000,     // default; feed ttl overrides if longer
  STATUS_POLL_IDLE_MS: 60_000,
  IDLE_AFTER_MS: 120_000,     // no heading/GPS movement for 2 min => idle
  STALE_AFTER_MS: 90_000,     // staleness badge threshold
  INFO_TTL_MS: 24 * 3600_000, // station_information cache

  GPS_BAD_ACCURACY_M: 50,

  // NOTE: the PRD's 2.3 URLs return 403 (verified 2026-06-10). The discovery
  // feed at gbfs.citibikenyc.com/gbfs/gbfs.json points to GBFS 1.1 on
  // gbfs.lyft.com — CORS is `*`, ttl 60s, num_ebikes_available present.
  GBFS_INFO_URL: 'https://gbfs.lyft.com/gbfs/1.1/bkn/en/station_information.json',
  GBFS_STATUS_URL: 'https://gbfs.lyft.com/gbfs/1.1/bkn/en/station_status.json',

  LS_INFO_KEY: 'wp.stationInfo.v1',
  LS_CAL_KEY: 'wp.calibrationOffset',
};
