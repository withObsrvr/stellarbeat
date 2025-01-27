import { HttpQueue } from 'http-helper';

export const TYPES = {
	CheckPointFrequency: Symbol('CheckPointFrequency'),
	ScanScheduler: Symbol('ScanScheduler'),
	ScanCoordinatorService: Symbol('ScanCoordinatorService'),
	JobMonitor: Symbol('JobMonitor'),
	ExceptionLogger: Symbol('ExceptionLogger'),
	HttpQueue: Symbol('HttpQueue'),
	HttpService: Symbol('HttpService')
};
