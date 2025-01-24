import { HttpQueue, RequestMethod, QueueError } from '../HttpQueue';
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
