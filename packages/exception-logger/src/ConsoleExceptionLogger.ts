import { ExceptionLogger } from './ExceptionLogger';

export class ConsoleExceptionLogger implements ExceptionLogger {
	captureException(error: Error): void {
		console.log('Captured exception', error);
	}
}
