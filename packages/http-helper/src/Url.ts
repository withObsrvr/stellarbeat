import { err, ok, Result } from 'neverthrow';
import validator from 'validator';

export class Url {
	public value;

	private constructor(url: string) {
		this.value = url;
	}

	static create(url: string): Result<Url, Error> {
		// Allow localhost and 127.0.0.1 without TLD requirement
		const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
		const validationOptions = { require_tld: !isLocalhost };

		if (!validator.isURL(url, validationOptions))
			return err(new Error('Url is not a proper url: ' + url));

		url = url.replace(/\/$/, ''); //remove trailing slash

		return ok(new Url(url));
	}
}
