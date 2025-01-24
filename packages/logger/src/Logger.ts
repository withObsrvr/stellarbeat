export type logFn = (
	message: string,
	obj?: Record<string, unknown>,
	...args: unknown[]
) => void;

export interface Logger {
	trace: logFn;
	debug: logFn;
	info: logFn;
	warn: logFn;
	error: logFn;
	fatal: logFn;
	getRawLogger: any;
}
