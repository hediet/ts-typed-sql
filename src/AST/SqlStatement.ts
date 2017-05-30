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
	| CommitTransactionStatement;

export class StartTransactionStatement {
	public toString() { return "START TRANSACTION"; }
}

export class CommitTransactionStatement {
	public toString() { return "COMMIT"; }
}

export class RollbackTransactionStatement {
	public toString() { return "ROLLBACK"; }
}