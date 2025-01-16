import axios, { AxiosError, AxiosResponse } from 'axios';

export function isHttpError(payload: unknown): payload is HttpError {
	return payload instanceof HttpError;
}

export type HttpResponse<T = unknown> = {
	data: T;
	status: number;
	statusText: string;
	headers: unknown;
};

export class HttpError<T = unknown> extends Error {
	code?: string;
	response?: HttpResponse<T>;
	constructor(message?: string, code?: string, response?: HttpResponse<T>) {
		super(message);
		this.code = code;
		this.response = response;
		this.name = 'HttpError';
	}
}

export class MailgunService {
	constructor(
		protected secret: string,
		protected from: string,
		protected baseUrl: string
	) {}

	async sendMessage(
		to: string,
		message: string,
		subject: string
	): Promise<HttpResponse | HttpError> {
		let timeout: NodeJS.Timeout | undefined;
		try {
			const source = axios.CancelToken.source();
			timeout = setTimeout(() => {
				source.cancel('Connection time-out');
			}, 2050);

			const config: Record<string, unknown> = {
				cancelToken: source.token,
				timeout: 2000,
				auth: {
					username: 'api',
					password: this.secret
				},
				headers: { 'content-type': 'application/x-www-form-urlencoded' }
			};

			const axiosResponse = await axios.post(
				this.baseUrl + '/messages',
				`from=${this.from}&to=${to}&subject=${subject}&html=${encodeURIComponent(message)}`,
				config
			);
			clearTimeout(timeout);
			return this.mapAxiosResponseToHttpResponse(axiosResponse);
		} catch (error) {
			if (timeout) clearTimeout(timeout);
			if (axios.isAxiosError(error)) {
				return this.mapAxiosErrorToHttpError(error);
			}
			if (error instanceof Error) return new HttpError(error.message, '500');
			return new HttpError('Error sending msg', '500');
		}
	}

	protected mapAxiosResponseToHttpResponse(
		axiosResponse: AxiosResponse
	): HttpResponse {
		return {
			data: axiosResponse.data,
			status: axiosResponse.status,
			statusText: axiosResponse.statusText,
			headers: axiosResponse.headers
		};
	}
	protected mapAxiosErrorToHttpError(axiosError: AxiosError): HttpError {
		console.log(axiosError.request);
		return new HttpError(
			axiosError.message + ': ' + axiosError.response?.statusText,
			axiosError.code,
			axiosError.response
		);
	}
}
