/**
 * In-process rolling average of successful worker job duration (ms).
 * BullMQ job counts come from the queue; this is local to the process.
 */

let totalMs = 0;
let samples = 0;

export function recordJobProcessMs(ms) {
  if (!Number.isFinite(ms) || ms < 0) return;
  totalMs += ms;
  samples += 1;
}

export function avgProcessMsSnapshot() {
  if (samples === 0) return 0;
  return Math.round(totalMs / samples);
}
