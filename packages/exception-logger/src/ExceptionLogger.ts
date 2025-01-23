export interface ExceptionLogger {
	captureException(error: Error, extra?: Record<string, unknown>): void;
}
