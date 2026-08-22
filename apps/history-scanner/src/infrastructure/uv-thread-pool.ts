import { config as loadEnv } from 'dotenv';
import * as os from 'os';
import * as path from 'path';

/**
 * Sizes the libuv thread pool for scanning.
 *
 * Bucket and category files are verified with a `gunzip -> sha256` pipeline per
 * file, and Node runs zlib on the libuv thread pool, which defaults to **4**
 * threads. A scan keeps dozens of those pipelines in flight, so with the
 * default the whole scan is gated by four threads no matter how high the HTTP
 * concurrency is set - raising concurrency alone buys almost nothing.
 *
 * libuv reads UV_THREADPOOL_SIZE the first time the pool is used and caches it
 * for the life of the process, so this module must be evaluated before anything
 * performs async zlib/crypto/fs work. Import it as the *first* import of an
 * entry point; it is a side-effecting module.
 */

// Same .env file Config.ts reads, loaded here because the pool size has to be
// resolved before the container (and therefore Config) is built. dotenv does
// not overwrite variables that are already set, so this is safe to call twice.
loadEnv({ path: path.resolve(__dirname, '../../.env') });

export const DEFAULT_MAX_CONCURRENCY = 100;

function positiveIntFromEnv(name: string): number | undefined {
	const value = Number(process.env[name]);
	return Number.isInteger(value) && value > 0 ? value : undefined;
}

function resolveThreadPoolSize(): number {
	// An explicit setting always wins - it is the documented escape hatch.
	const explicit = positiveIntFromEnv('UV_THREADPOOL_SIZE');
	if (explicit !== undefined) return explicit;

	const maxConcurrency =
		positiveIntFromEnv('HISTORY_MAX_CONCURRENCY') ?? DEFAULT_MAX_CONCURRENCY;

	// Decompression is CPU bound, so there is little to gain far past the core
	// count; 2x leaves headroom for threads parked on other blocking work. Never
	// go below Node's own default of 4.
	const cpuCount = os.cpus().length || 4;
	return Math.max(4, Math.min(maxConcurrency, cpuCount * 2));
}

export const uvThreadPoolSize = resolveThreadPoolSize();

process.env.UV_THREADPOOL_SIZE = String(uvThreadPoolSize);
