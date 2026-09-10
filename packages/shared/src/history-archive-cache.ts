//Checkpoints publish roughly every 64 ledgers, about 320 seconds. A cache TTL
//on .well-known/stellar-history.json above that lets a cached copy outlive the
//file it describes, so the archive freshness check can be answered with stale
//data and its result stops being meaningful.
export const MAX_SAFE_HISTORY_ARCHIVE_CACHE_TTL_SECONDS = 320;
