/**
 * HTTP client for Python FBAS microservice
 *
 * Handles communication with FastAPI service wrapping python-fbas CLI
 */

import { Result, ok, err } from 'neverthrow';
import {
	IPythonFbasHttpClient,
	PythonFbasAnalysisRequest,
	PythonFbasTopTierResponse,
	PythonFbasBlockingSetsResponse,
	PythonFbasSplittingSetsResponse,
	PythonFbasQuorumsResponse
} from './PythonFbasAdapter';

export interface PythonFbasHttpClientConfig {
	baseUrl: string;
	timeout: number; // milliseconds
	retries: number;
}

export class PythonFbasHttpClient implements IPythonFbasHttpClient {
	constructor(private readonly config: PythonFbasHttpClientConfig) {}

	async analyzeTopTier(
		request: PythonFbasAnalysisRequest
	): Promise<Result<PythonFbasTopTierResponse, Error>> {
		return await this.post<PythonFbasTopTierResponse>(
			'/analyze/top-tier',
			request
		);
	}

	async analyzeBlockingSets(
		request: PythonFbasAnalysisRequest
	): Promise<Result<PythonFbasBlockingSetsResponse, Error>> {
		return await this.post<PythonFbasBlockingSetsResponse>(
			'/analyze/blocking-sets',
			request
		);
	}

	async analyzeSplittingSets(
		request: PythonFbasAnalysisRequest
	): Promise<Result<PythonFbasSplittingSetsResponse, Error>> {
		return await this.post<PythonFbasSplittingSetsResponse>(
			'/analyze/splitting-sets',
			request
		);
	}

	async analyzeQuorums(
		request: PythonFbasAnalysisRequest
	): Promise<Result<PythonFbasQuorumsResponse, Error>> {
		return await this.post<PythonFbasQuorumsResponse>(
			'/analyze/quorums',
			request
		);
	}

	async healthCheck(): Promise<Result<{ status: string }, Error>> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				this.config.timeout
			);

			const response = await fetch(`${this.config.baseUrl}/health`, {
				method: 'GET',
				signal: controller.signal,
				headers: {
					'Content-Type': 'application/json'
				}
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				return err(
					new Error(
						`Health check failed with status ${response.status}: ${response.statusText}`
					)
				);
			}

			const data = (await response.json()) as { status: string };
			return ok({ status: data.status });
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					return err(
						new Error(
							`Health check timeout after ${this.config.timeout}ms`
						)
					);
				}
				return err(error);
			}
			return err(new Error(String(error)));
		}
	}

	/**
	 * Generic POST request with retry logic
	 */
	private async post<T>(
		endpoint: string,
		body: unknown
	): Promise<Result<T, Error>> {
		let lastError: Error | null = null;

		for (let attempt = 0; attempt < this.config.retries; attempt++) {
			try {
				const result = await this.makeRequest<T>(endpoint, body);
				if (result.isOk()) {
					return result;
				}

				lastError = result.error;

				// Don't retry on certain errors (client errors)
				if (this.shouldNotRetry(result.error)) {
					return result;
				}

				// Exponential backoff before retry
				if (attempt < this.config.retries - 1) {
					await this.delay(Math.pow(2, attempt) * 1000);
				}
			} catch (error) {
				lastError =
					error instanceof Error ? error : new Error(String(error));
			}
		}

		return err(
			lastError ||
				new Error(`Request failed after ${this.config.retries} attempts`)
		);
	}

	/**
	 * Make single HTTP request
	 */
	private async makeRequest<T>(
		endpoint: string,
		body: unknown
	): Promise<Result<T, Error>> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(
				() => controller.abort(),
				this.config.timeout
			);

			const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
				method: 'POST',
				signal: controller.signal,
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(body)
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorText = await response.text();
				return err(
					new Error(
						`HTTP ${response.status}: ${response.statusText} - ${errorText}`
					)
				);
			}

			const data = await response.json();
			return ok(data as T);
		} catch (error) {
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					return err(
						new Error(`Request timeout after ${this.config.timeout}ms`)
					);
				}
				return err(error);
			}
			return err(new Error(String(error)));
		}
	}

	/**
	 * Determine if error should not be retried
	 */
	private shouldNotRetry(error: Error): boolean {
		// Don't retry client errors (4xx)
		if (error.message.includes('HTTP 4')) {
			return true;
		}

		// Don't retry validation errors
		if (
			error.message.includes('validation') ||
			error.message.includes('invalid')
		) {
			return true;
		}

		return false;
	}

	/**
	 * Delay helper for backoff
	 */
	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

/**
 * Factory for creating configured client
 */
export class PythonFbasHttpClientFactory {
	static create(overrides?: Partial<PythonFbasHttpClientConfig>): PythonFbasHttpClient {
		const config: PythonFbasHttpClientConfig = {
			baseUrl:
				overrides?.baseUrl ||
				process.env.PYTHON_FBAS_SERVICE_URL ||
				'http://localhost:8000',
			timeout: overrides?.timeout || 60000, // 60 seconds
			retries: overrides?.retries || 3
		};

		return new PythonFbasHttpClient(config);
	}
}
