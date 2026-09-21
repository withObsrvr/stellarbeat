import { promises as dns } from 'dns';
import { injectable } from 'inversify';

export interface DnsAnswer {
	ip: string;
	ttl: number | null;
}

export interface EndpointDnsResolver {
	resolve(hostname: string): Promise<DnsAnswer[]>;
}

@injectable()
export class SystemEndpointDnsResolver implements EndpointDnsResolver {
	async resolve(hostname: string): Promise<DnsAnswer[]> {
		const [ipv4, ipv6] = await Promise.all([
			dns.resolve4(hostname, { ttl: true }).catch(() => []),
			dns.resolve6(hostname, { ttl: true }).catch(() => [])
		]);

		return [...ipv4, ...ipv6].map((answer) => ({
			ip: answer.address,
			ttl: answer.ttl ?? null
		}));
	}
}
