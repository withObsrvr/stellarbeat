import { err, ok, Result } from 'neverthrow';
import { BucketScanState } from './ScanState';
import { BucketRequestMeta, RequestGenerator } from './RequestGenerator';
import {
	FileNotFoundError,
	HttpQueue,
	QueueError,
	Request,
	RequestMethod,
	RetryableQueueError
} from 'http-helper';
import { inject, injectable } from 'inversify';
import { mapHttpQueueErrorToScanError } from './mapHttpQueueErrorToScanError';
import { createGunzip } from 'zlib';
import { createHash } from 'crypto';
import * as stream from 'stream';
import { pipeline } from 'stream/promises';
import { mapUnknownToError } from 'shared';
import { ScanError, ScanErrorCategory, ScanErrorType } from '../scan/ScanError';
import { isZLibError } from './isZLibError';
import { TYPES } from '../../infrastructure/di/di-types';

export interface BucketScanResult {
	errors: ScanError[];
}

@injectable()
export class BucketScanner {
	constructor(@inject(TYPES.HttpQueue) private httpQueue: HttpQueue) {}

	async scan(
		scanState: BucketScanState,
		verify = false
	): Promise<Result<BucketScanResult, ScanError>> {
		if (verify) {
			return await this.verify(scanState);
		} else {
			return (await this.exists(scanState)).map(() => ({ errors: [] }));
		}
	}

	private async verify(
		scanState: BucketScanState
	): Promise<Result<BucketScanResult, ScanError>> {
		const bucketErrors: ScanError[] = [];

		const verify = async (
			readStream: unknown,
			request: Request<BucketRequestMeta>
		): Promise<Result<void, QueueError>> => {
			if (!(readStream instanceof stream.Readable))
				return err(new FileNotFoundError(request));
			const zlib = createGunzip();
			const hasher = createHash('sha256');

			try {
				await pipeline(readStream, zlib, hasher);
				if (hasher.digest('hex') !== request.meta?.hash) {
					// Collect error and continue scanning
					bucketErrors.push(
						new ScanError(
							ScanErrorType.TYPE_VERIFICATION,
							request.url.value,
							'Wrong bucket hash',
							1,
							ScanErrorCategory.BUCKET_HASH
						)
					);
				}
				return ok(undefined);
			} catch (error: unknown) {
				if (isZLibError(error)) {
					return err(
						new RetryableQueueError(
							request,
							new ScanError(
								ScanErrorType.TYPE_VERIFICATION,
								request.url.value,
								error.message
							)
						)
					);
				} else {
					return err(
						new RetryableQueueError(request, mapUnknownToError(error))
					);
				}
			}
		};

		const verifyBucketsResult =
			await this.httpQueue.sendRequests<BucketRequestMeta>(
				RequestGenerator.generateBucketRequests(
					scanState.bucketHashesToScan,
					scanState.baseUrl,
					RequestMethod.GET
				),
				{
					stallTimeMs: 150,
					concurrency: scanState.concurrency,
					nrOfRetries: 6, //last retry is after 1 min wait. 2 minute total wait time
					rampUpConnections: true,
					httpOptions: {
						httpAgent: scanState.httpAgent,
						httpsAgent: scanState.httpsAgent,
						responseType: 'stream',
						socketTimeoutMs: 60000,
						connectionTimeoutMs: 10000
					}
				},
				verify
			);

		if (verifyBucketsResult.isErr()) {
			return err(mapHttpQueueErrorToScanError(verifyBucketsResult.error));
		}

		return ok({ errors: bucketErrors });
	}

	private async exists(scanState: BucketScanState) {
		const bucketsExistResult =
			await this.httpQueue.sendRequests<BucketRequestMeta>(
				RequestGenerator.generateBucketRequests(
					scanState.bucketHashesToScan,
					scanState.baseUrl,
					RequestMethod.HEAD
				),
				{
					stallTimeMs: 150,
					concurrency: scanState.concurrency,
					nrOfRetries: 6, //last retry is after 1 min wait. 2 minute total wait time
					rampUpConnections: true,
					httpOptions: {
						responseType: undefined,
						socketTimeoutMs: 5000,
						connectionTimeoutMs: 5000,
						httpAgent: scanState.httpAgent,
						httpsAgent: scanState.httpsAgent
					}
				}
			);

		if (bucketsExistResult.isErr()) {
			return err(mapHttpQueueErrorToScanError(bucketsExistResult.error));
		}

		return ok(undefined);
	}
}
