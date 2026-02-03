import protocol from './protocol';

// Simple cron starter for Reputa workers. This module is imported by api-server.ts
// and starts a 15-minute interval job. The job currently logs placeholders and
// exposes hooks where fetching and reconciliation logic should be added.

function nowIso() {
  return new Date().toISOString();
}

async function fetchAndReconcile() {
  console.log(`[REPUTA CRON] Running fetchAndReconcile at ${nowIso()}`);
  // Implementation attempts:
  try {
    // get tracked wallets (optional set maintained elsewhere)
    const trackedKey = 'tracked_wallets';
    const { Redis } = await import('@upstash/redis');
    // Note: the main server already has a Redis client; this worker expects
    // it to be available via environment redis connection or shared import.
    // Here we attempt to read tracked wallets keys from Redis if present.
    // For now, use fetch via environment/upstash SDK if configured.
    // Placeholder: read list from a Redis key 'tracked_wallets' via fetch to REST API
    // If no external access is configured, this function will just log.
    console.log('[REPUTA CRON] fetchAndReconcile: placeholder run — no external wallet source configured');
  } catch (err) {
    console.error('[REPUTA CRON] fetchAndReconcile error', err);
  }
}

async function weeklyMerge() {
  console.log(`[REPUTA CRON] Running weeklyMerge at ${nowIso()}`);
  // TODO: aggregate App_Points weekly and apply merge rules (0.2 factor)
}

// Start intervals when module is imported.
const FIFTEEN_MIN = 15 * 60 * 1000;
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

setTimeout(() => fetchAndReconcile(), 5000);
setInterval(fetchAndReconcile, FIFTEEN_MIN);
setInterval(weeklyMerge, ONE_WEEK);

console.log('[REPUTA CRON] Cron initialized (15min fetch, weekly merge)');

export { fetchAndReconcile, weeklyMerge };
