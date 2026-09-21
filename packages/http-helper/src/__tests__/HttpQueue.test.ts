import {
	HttpQueue,
	RequestMethod,
	QueueError,
	FileNotFoundError,
	RetryableQueueError
} from '../HttpQueue';
import { mock } from 'jest-mock-extended';
import { LoggerMock } from '../__mocks__/LoggerMock';
import { HttpService, HttpError } from '../HttpService';
import { err, ok } from 'neverthrow';
import { Url } from '../Url';

const dummyUrlResult = Url.create('http://test.com');
if (!dummyUrlResult.isOk()) throw dummyUrlResult.error;
const dummyUrl = dummyUrlResult.value;

it('should bust cache', async function () {
	const httpService = mock<HttpService>();
	httpService.get.mockResolvedValue(
		ok({ status: 200, data: [], statusText: 'ok', headers: {} })
	);
	const httpQueue = new HttpQueue(httpService, new LoggerMock());

	await httpQueue.sendRequests(
		[
			{
				url: dummyUrl,
				meta: {},
				method: RequestMethod.GET
			}
		][Symbol.iterator](),
		{
			cacheBusting: true,
			concurrency: 1,
			rampUpConnections: false,
			nrOfRetries: 0,
			stallTimeMs: 100,
			httpOptions: {}
		}
	);

	expect(httpService.get).toHaveBeenCalledTimes(1);
	expect(
		httpService.get.mock.calls[0][0].value.indexOf('bust') > 0
	).toBeTruthy();
});

it('should handle sending requests with an error', async function () {
	const httpService = mock<HttpService>();
	httpService.get.mockResolvedValue(
		err(new HttpError('Network error', 'ECONNABORTED'))
	);
	const httpQueue = new HttpQueue(httpService, new LoggerMock());

	const result = await httpQueue.sendRequests(
		[
			{
				url: dummyUrl,
				meta: {},
				method: RequestMethod.GET
			}
		][Symbol.iterator](),
		{
			cacheBusting: false,
			concurrency: 1,
			rampUpConnections: false,
			nrOfRetries: 0,
			stallTimeMs: 100,
			httpOptions: {}
		}
	);

	expect(result.isErr()).toBeTruthy();
	if (result.isErr()) {
		expect(result.error).toBeInstanceOf(QueueError);
		expect(result.error.message).toContain('Network error');
	}
});

describe('status code classification', () => {
	function sendWithStatus(status: number, nrOfRetries = 3) {
		const httpService = mock<HttpService>();
		const httpError = new HttpError('Request failed', 'ERR_BAD_REQUEST', {
			status,
			statusText: 'error',
			data: {},
			headers: {}
		});
		httpService.get.mockResolvedValue(err(httpError));
		const httpQueue = new HttpQueue(httpService, new LoggerMock());

		return {
			httpService,
			result: httpQueue.sendRequests(
				[
					{ url: dummyUrl, meta: {}, method: RequestMethod.GET }
				][Symbol.iterator](),
				{
					concurrency: 1,
					rampUpConnections: false,
					nrOfRetries,
					stallTimeMs: 1,
					httpOptions: {}
				}
			)
		};
	}

	it('should treat 403 as a missing file and not retry it', async () => {
		// S3 returns 403 instead of 404 for absent objects when the caller cannot
		// ListBucket. Retrying is futile - the scanner has no credentials - and
		// classifying it as retryable aborted whole scans of partial archives.
		const { httpService, result } = sendWithStatus(403);
		const outcome = await result;

		expect(outcome.isErr()).toBe(true);
		if (outcome.isErr()) {
			expect(outcome.error).toBeInstanceOf(FileNotFoundError);
			expect(outcome.error.message).toContain('403');
		}
		expect(httpService.get).toHaveBeenCalledTimes(1);
	});

	it('should still classify a 500 as retryable', async () => {
		// The 403 change must not make every failure terminal - a genuine server
		// error still has to be retried.
		const { result } = sendWithStatus(500, 0);
		const outcome = await result;

		expect(outcome.isErr()).toBe(true);
		if (outcome.isErr()) {
			expect(outcome.error).toBeInstanceOf(RetryableQueueError);
			expect(outcome.error).not.toBeInstanceOf(FileNotFoundError);
		}
	});

	it('should name the url in the error message rather than [object Object]', async () => {
		const { result } = sendWithStatus(403);
		const outcome = await result;

		expect(outcome.isErr()).toBe(true);
		if (outcome.isErr()) {
			expect(outcome.error.message).toContain('http://test.com');
			expect(outcome.error.message).not.toContain('[object Object]');
		}
	});
});
