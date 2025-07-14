export interface TrustConfig {
	organizations: {
		[name: string]: OrganizationTrustConfig;
	};
	defaultOrganization: string;
	enableSeededTrust: boolean;
}

export interface OrganizationTrustConfig {
	name: string;
	displayName: string;
	seedNodes: string[];
	autoDiscovery?: {
		enabled: boolean;
		domainPattern?: string;
		validatorKeyList?: string;
	};
}

// Default trust configuration
export const DEFAULT_TRUST_CONFIG: TrustConfig = {
	organizations: {
		'obsrvr': {
			name: 'obsrvr',
			displayName: 'Obsrvr',
			seedNodes: [
				// Add Obsrvr's validator public keys here
				// 'GCKWUQGSVO45ZV3QK7POYL7HMFWDKWJVMFVEGUJKCAEVUITUCTQWFSM6',
			],
			autoDiscovery: {
				enabled: true,
				domainPattern: '*.obsrvr.com'
			}
		},
		'stellar-development-foundation': {
			name: 'stellar-development-foundation',
			displayName: 'Stellar Development Foundation',
			seedNodes: [
				'GCKFBEIYTKP5ROORWXRLUFYKNEVHPVGM4SYBCTNYEQEQDMKFQTGUGVOA',
				'GCGB2S2KGYARPVIA37HYZXVRM2YZUEXA6S33ZU5BUDC6THSB62LZSTYH',
				'GCPOU6WCGQJPLCCSIBHXO636K5B5W2JDCGPQ6YFQP4HEPEFNHVHQKLFH'
			],
			autoDiscovery: {
				enabled: true,
				domainPattern: '*.stellar.org'
			}
		},
		'satoshipay': {
			name: 'satoshipay',
			displayName: 'SatoshiPay',
			seedNodes: [
				'GC5SXLNAM3C4NMGK2PXK4R34B5GNZ47FYQ24ZIBFDFOCU6D4KBN4POAE',
				'GBJQUIXUO4XSNPAUT6ODLZUJRV2NPXYASKUBY4G5MYP3M47PCVI55MNT'
			],
			autoDiscovery: {
				enabled: true,
				domainPattern: '*.satoshipay.io'
			}
		},
		'lobstr': {
			name: 'lobstr',
			displayName: 'LOBSTR',
			seedNodes: [
				'GCFONE23AB7Y6EYXW1SG7CHU26MG7UGHV7HCMR7XAQFGK4F6IRNQFHP7'
			],
			autoDiscovery: {
				enabled: true,
				domainPattern: '*.lobstr.co'
			}
		}
	},
	defaultOrganization: 'obsrvr',
	enableSeededTrust: true
};

/**
 * Service for managing trust configuration
 */
export class TrustConfigService {
	private config: TrustConfig;

	constructor(config: TrustConfig = DEFAULT_TRUST_CONFIG) {
		this.config = config;
	}

	/**
	 * Gets the full trust configuration
	 */
	getConfig(): TrustConfig {
		return this.config;
	}

	/**
	 * Gets configuration for a specific organization
	 */
	getOrganizationConfig(organizationName: string): OrganizationTrustConfig | null {
		return this.config.organizations[organizationName] || null;
	}

	/**
	 * Gets all available organizations
	 */
	getAvailableOrganizations(): OrganizationTrustConfig[] {
		return Object.values(this.config.organizations);
	}

	/**
	 * Gets the default organization configuration
	 */
	getDefaultOrganizationConfig(): OrganizationTrustConfig | null {
		return this.getOrganizationConfig(this.config.defaultOrganization);
	}

	/**
	 * Checks if seeded trust is enabled
	 */
	isSeededTrustEnabled(): boolean {
		return this.config.enableSeededTrust;
	}

	/**
	 * Validates an organization configuration
	 */
	validateOrganizationConfig(config: OrganizationTrustConfig): {
		valid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		if (!config.name || config.name.trim().length === 0) {
			errors.push('Organization name is required');
		}

		if (!config.displayName || config.displayName.trim().length === 0) {
			errors.push('Organization display name is required');
		}

		if (!config.seedNodes || config.seedNodes.length === 0) {
			errors.push('At least one seed node is required');
		}

		// Validate seed node format (basic Stellar public key validation)
		config.seedNodes.forEach((seedNode, index) => {
			if (!this.isValidStellarPublicKey(seedNode)) {
				errors.push(`Invalid public key format for seed node ${index + 1}: ${seedNode}`);
			}
		});

		// Validate auto-discovery configuration if provided
		if (config.autoDiscovery?.enabled) {
			if (config.autoDiscovery.domainPattern && !this.isValidDomainPattern(config.autoDiscovery.domainPattern)) {
				errors.push(`Invalid domain pattern: ${config.autoDiscovery.domainPattern}`);
			}

			if (config.autoDiscovery.validatorKeyList && !this.isValidUrl(config.autoDiscovery.validatorKeyList)) {
				errors.push(`Invalid validator key list URL: ${config.autoDiscovery.validatorKeyList}`);
			}
		}

		return {
			valid: errors.length === 0,
			errors
		};
	}

	/**
	 * Adds or updates an organization configuration
	 */
	updateOrganizationConfig(config: OrganizationTrustConfig): boolean {
		const validation = this.validateOrganizationConfig(config);
		if (!validation.valid) {
			throw new Error(`Invalid organization config: ${validation.errors.join(', ')}`);
		}

		this.config.organizations[config.name] = config;
		return true;
	}

	/**
	 * Removes an organization configuration
	 */
	removeOrganizationConfig(organizationName: string): boolean {
		if (organizationName === this.config.defaultOrganization) {
			throw new Error('Cannot remove the default organization');
		}

		if (this.config.organizations[organizationName]) {
			delete this.config.organizations[organizationName];
			return true;
		}

		return false;
	}

	/**
	 * Basic validation for Stellar public keys
	 */
	private isValidStellarPublicKey(publicKey: string): boolean {
		// Basic validation: starts with G, length 56, alphanumeric
		const stellarPubKeyRegex = /^G[A-Z0-9]{55}$/;
		return stellarPubKeyRegex.test(publicKey);
	}

	/**
	 * Basic validation for domain patterns
	 */
	private isValidDomainPattern(pattern: string): boolean {
		// Allow patterns like *.example.com, example.com, etc.
		const domainPatternRegex = /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
		return domainPatternRegex.test(pattern);
	}

	/**
	 * Basic URL validation
	 */
	private isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch {
			return false;
		}
	}
}