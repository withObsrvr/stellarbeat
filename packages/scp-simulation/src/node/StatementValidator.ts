import { QuorumService } from '../federated-voting/QuorumService';
import { Statement } from '../federated-voting/Statement';

//in the future this should be an interface, that is implemented in the context (e.g. valid statement in ledger, valid lunch option, etc.)
//this is a dummy implementation at the moment
export class StatementValidator {
	isValid(statement: Statement, node: QuorumService): boolean {
		return node && statement.toString().length > 0;
	}
}
