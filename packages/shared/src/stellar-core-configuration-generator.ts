import { Network } from './network';
import { Node } from './node';
import { QuorumSet } from './quorum-set';

enum Quality {
	HIGH = 'HIGH',
	MEDIUM_OR_LOW = 'MEDIUM_OR_LOW'
}

type HomeDomain = {
	HOME_DOMAIN: string;
	QUALITY: Quality;
};

type Validator = {
	NAME: string; //A unique alias for the node
	QUALITY?: string; //Rating for node (required unless specified in [[HOME_DOMAINS]]): HIGH, MEDIUM, or LOW.
	HOME_DOMAIN?: string; //URL of home domain linked to validator
	PUBLIC_KEY: string; //Stellar public key associated with validator
	ADDRESS?: string; //	Peer:port associated with validator (optional)
	HISTORY?: string; //	archive GET command associated with validator (optional)
};

type TomlConfig = {
	HOME_DOMAINS: HomeDomain[];
	VALIDATORS: Validator[];
};

export default class StellarCoreConfigurationGenerator {
	protected network: Network;

	constructor(network: Network) {
		this.network = network;
	}

	quorumSetToToml(quorumSet: QuorumSet) {
		const alreadyAddedHomeDomains: Set<string> = new Set<string>();
		const tomlConfig: TomlConfig = {
			HOME_DOMAINS: [],
			VALIDATORS: []
		};

		this.processQuorumSet(quorumSet, tomlConfig, alreadyAddedHomeDomains);

		return this.stringifyToml(tomlConfig);
	}

	private stringifyToml(tomlConfig: TomlConfig) {
		let tomlString = '';

		tomlConfig.HOME_DOMAINS.forEach((homeDomain) => {
			tomlString += `[[HOME_DOMAINS]]\nHOME_DOMAIN = "${homeDomain.HOME_DOMAIN}"\nQUALITY = "${homeDomain.QUALITY}"\n\n`;
		});

		tomlConfig.VALIDATORS.forEach((validator, index) => {
			tomlString += `[[VALIDATORS]]\n`;
			tomlString += `NAME = "${validator.NAME}"\n`;
			tomlString += `PUBLIC_KEY = "${validator.PUBLIC_KEY}"\n`;
			if (validator.ADDRESS) {
				tomlString += `ADDRESS = "${validator.ADDRESS}"\n`;
			}
			if (validator.HISTORY) {
				tomlString += `HISTORY = "${validator.HISTORY}"\n`;
			}
			if (validator.HOME_DOMAIN) {
				tomlString += `HOME_DOMAIN = "${validator.HOME_DOMAIN}"\n`;
			}
			if (validator.QUALITY) {
				tomlString += `QUALITY = "${validator.QUALITY}"\n`;
			}
			// Don't add a newline after the last validator
			if (index !== tomlConfig.VALIDATORS.length - 1) {
				tomlString += '\n';
			}
		});

		return tomlString;
	}

	nodesToToml(nodes: Node[]) {
		const alreadyAddedHomeDomains: Set<string> = new Set<string>();
		const tomlConfig: TomlConfig = {
			HOME_DOMAINS: [],
			VALIDATORS: []
		};
		nodes.forEach((node) =>
			this.processValidator(node, alreadyAddedHomeDomains, tomlConfig)
		);

		return this.stringifyToml(tomlConfig);
	}

	protected processQuorumSet(
		quorumSet: QuorumSet,
		tomlConfig: TomlConfig,
		alreadyAddedHomeDomains: Set<string> = new Set<string>()
	) {
		quorumSet.validators.forEach((validator) =>
			this.processValidator(
				this.network.getNodeByPublicKey(validator),
				alreadyAddedHomeDomains,
				tomlConfig
			)
		);

		quorumSet.innerQuorumSets.forEach((innerQSet) =>
			this.processQuorumSet(innerQSet, tomlConfig, alreadyAddedHomeDomains)
		);
	}

	protected processValidator(
		validatorNode: Node,
		alreadyAddedHomeDomains: Set<string>,
		tomlConfig: TomlConfig
	) {
		const validatorToml: Validator = {
			NAME: validatorNode.displayName!,
			PUBLIC_KEY: validatorNode.publicKey!,
			ADDRESS: validatorNode.host ?? validatorNode.key
		};
		if (validatorNode.historyUrl) {
			let historyUrlWithTrailingSlash = validatorNode.historyUrl;
			if (!historyUrlWithTrailingSlash.endsWith('/'))
				historyUrlWithTrailingSlash += '/';

			validatorToml.HISTORY = `curl -sf ${historyUrlWithTrailingSlash}{0} -o {1}`;
		}

		if (validatorNode.homeDomain) {
			let quality = Quality.MEDIUM_OR_LOW;
			if (validatorNode.organizationId) {
				const organization = this.network.getOrganizationById(
					validatorNode.organizationId
				);
				if (organization!.isTierOneOrganization) quality = Quality.HIGH;
			}

			if (!alreadyAddedHomeDomains.has(validatorNode.homeDomain)) {
				alreadyAddedHomeDomains.add(validatorNode.homeDomain);
				tomlConfig.HOME_DOMAINS.push({
					HOME_DOMAIN: validatorNode.homeDomain,
					QUALITY: quality
				});
			}

			validatorToml.HOME_DOMAIN = validatorNode.homeDomain;
		} else {
			validatorToml.QUALITY = Quality.MEDIUM_OR_LOW;
		}

		tomlConfig.VALIDATORS!.push(validatorToml);
	}
}
