import { CommitTransactionStatement, RollbackTransactionStatement, SqlStatement, StartTransactionStatement } from './AST/SqlStatement';
import { Query } from "./AST/Queries/Query";
import { RetrievalQuery } from "./AST/Queries/RetrievalQuery";

export interface SimpleDbQueryService {
	exec<TColumns>(query: Query<TColumns>): Promise<TColumns[]>;
	exec<TColumns>(statement: SqlStatement): Promise<void>;
}

export interface DbQueryService extends SimpleDbQueryService {
	getExclusiveQueryService<T>(scope: (service: SimpleDbQueryService) => Promise<T>): Promise<T>;
}

export class DbQueryInterface {
	constructor(protected readonly queryService: SimpleDbQueryService) { }

	public exec<TColumns>(query: Query<TColumns>): Promise<TColumns[]>;
	public exec<TColumns>(statement: SqlStatement): Promise<void>;
	public exec<TColumns>(statement: SqlStatement): Promise<TColumns[]> | Promise<void> {
		return this.queryService.exec(statement);
	}

	public async firstOrUndefined<TColumns>(query: RetrievalQuery<TColumns, any>): Promise<TColumns | undefined> {
		const q = query.limit(1);
		const rows = await this.exec(q);
		return rows[0];
	}

	public async first<TColumns>(query: RetrievalQuery<TColumns, any>): Promise<TColumns> {
		const result = await this.firstOrUndefined(query);
		if (!result) throw new Error("Expected at least one row.");
		return result;
	}

	public async single<TColumns>(query: RetrievalQuery<TColumns, any>): Promise<TColumns> {
		const q = query.limit(2);
		const rows = await this.exec(q);
		if (rows.length === 0) throw new Error("No row found.");
		if (rows.length >= 2) throw new Error("More than one row returned.");
		return rows[0];
	}

	public async firstOrUndefinedValue<TColumns, TColumn extends keyof TColumns>(query: RetrievalQuery<TColumns, TColumn>): Promise<TColumns[TColumn] | undefined> {
		const row = await this.firstOrUndefined(query);
		if (!row) return undefined;
		return row[query.singleColumn];
	}

	public async firstValue<TColumns, TColumn extends keyof TColumns>(query: RetrievalQuery<TColumns, TColumn>): Promise<TColumns[TColumn]> {
		const row = await this.first(query);
		return row[query.singleColumn];
	}

	public async singleValue<TColumns, TColumn extends keyof TColumns>(query: RetrievalQuery<TColumns, TColumn>): Promise<TColumns[TColumn]> {
		const row = await this.single(query);
		return row[query.singleColumn];
	}
}

export class TransactingQueryService extends DbQueryInterface {
	private _isTransactionOpen: boolean;

	public get isTransactionOpen(): boolean { return this._isTransactionOpen; }

	public exec<TColumns>(query: Query<TColumns>): Promise<TColumns[]>;
	public exec<TColumns>(statement: SqlStatement): Promise<void>;
	public exec<TColumns>(statement: SqlStatement): Promise<TColumns[]> | Promise<void> {
		if (!this._isTransactionOpen) throw new Error("Transaction has been closed.");
		return super.exec(statement);
	}

	public async rollback() {
		await this.exec(new RollbackTransactionStatement());
		this._isTransactionOpen = false;
	}

	public async commit() {
		await this.exec(new CommitTransactionStatement());
		this._isTransactionOpen = false;
	}
}

export class DbConnection extends DbQueryInterface {
	constructor(protected readonly queryService: DbQueryService) { super(queryService); }

	public async transaction<T>(scope: (queryInterface: TransactingQueryService) => Promise<T>): Promise<T> {
		return this.queryService.getExclusiveQueryService(async s => {
			const queryInterface = new TransactingQueryService(s);
			await queryInterface.exec(new StartTransactionStatement());
			let error = undefined;
			let result: { success: true, result: T } | { success: false, error: any };
			try {
				result = { success: true, result: await scope(queryInterface) };
			}
			catch (err) {
				result = { success: false, error: err };
			}

			if (result.success) {
				if (queryInterface.isTransactionOpen)
					await queryInterface.commit();
				return result.result;
			}
			else {
				if (queryInterface.isTransactionOpen)
					await queryInterface.rollback();
				throw result.error;
			}
		});
	}
}
