import { DeleteQuery } from "./Queries/DeleteQuery";
import { InsertQuery } from "./Queries/InsertQuery";
import { SelectQuery } from "./Queries/SelectQuery";
import { UpdateQuery } from "./Queries/UpdateQuery";
import { ValuesQuery } from "./Queries/ValuesQuery";

export type SqlStatement = DeleteQuery<any, any, any>
	| InsertQuery<any, any, any>
	| SelectQuery<any, any, any>
	| UpdateQuery<any, any, any, any>
	| ValuesQuery<any>
	| StartTransactionStatement
	| CommitTransactionStatement
	| RollbackTransactionStatement;

export enum IsolationLevel {
	Serializable,
	RepeatableRead,
	ReadCommitted,
	ReadUncommitted 
}

function isolationLevelToString (isolationLevel: IsolationLevel) {
	switch (isolationLevel) {
		case IsolationLevel.Serializable: return "SERIALIZABLE";
		case IsolationLevel.RepeatableRead: return "REPEATABLE READ";
		case IsolationLevel.ReadCommitted: return "READ COMMITTED";
		case IsolationLevel.ReadUncommitted: return "READ UNCOMMITTED";
		default: throw new Error(`Invalid isolation level '${isolationLevel}'.`);
	}
}

export class StartTransactionStatement {
	constructor(public readonly isolationLevel?: IsolationLevel) {
	}

	public toString() {
		const isoLevel = this.isolationLevel ? (" ISOLATION LEVEL " + isolationLevelToString(this.isolationLevel)) : "";

		return `START TRANSACTION${isoLevel}`;
	}
}

export class CommitTransactionStatement {
	public toString() { return "COMMIT"; }
}

export class RollbackTransactionStatement {
	public toString() { return "ROLLBACK"; }
}