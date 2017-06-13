import { CommitTransactionStatement, RollbackTransactionStatement, SqlStatement, StartTransactionStatement, IsolationLevel } from './AST/SqlStatement';
import { Query } from "./AST/Queries/Query";
import { RetrievalQuery } from "./AST/Queries/RetrievalQuery";
import { GetOutType, MapOutType } from "./AST/Types";
import { Row } from "./AST/FromFactor";

export interface SimpleDbQueryService {
	exec<TRow extends Row>(query: Query<TRow, any>): Promise<MapOutType<TRow>[]>;
	exec<TRow extends Row>(statement: SqlStatement): Promise<void>;
}

export interface DbQueryService extends SimpleDbQueryService {
	getExclusiveQueryService<T>(scope: (service: SimpleDbQueryService) => Promise<T>): Promise<T>;
}

/**
 * Provides methods to execute queries.
 */
export class DbQueryInterface {
	constructor(protected readonly queryService: SimpleDbQueryService) { }

	public exec<TRow extends Row>(query: Query<TRow, any>): Promise<MapOutType<TRow>[]>;
	public exec<TRow extends Row>(statement: SqlStatement): Promise<void>;
	public exec<TRow extends Row>(statement: SqlStatement): Promise<MapOutType<TRow>[]> | Promise<void> {
		return this.queryService.exec(statement);
	}

	/**
	 * Executes the query that only selects a single column and returns a list of values.
	 * @param query A query that only selects a single column.
	 */
	public async values<TRow extends Row, TColumn extends keyof TRow>(query: Query<TRow, TColumn>): Promise<GetOutType<TRow[TColumn]>[]> {
		const rows = await this.exec(query);
		return rows.map(r => r[query.singleColumn]);
	}

	/**
	 * Returns the first row or `undefined` if there is none.
	 * @param query The query to execute.
	 */
	public async firstOrUndefined<TRow extends Row>(query: Query<TRow, any>): Promise<MapOutType<TRow> | undefined> {
		if (query instanceof RetrievalQuery)
			query = query.limit(1);
		const rows = await this.exec(query);
		return rows[0];
	}

	/**
	 * Returns the first row. Throws an `Error` if there is none.
	 * @param query The query to execute.
	 */
	public async first<TRow extends Row>(query: Query<TRow, any>): Promise<MapOutType<TRow>> {
		const result = await this.firstOrUndefined(query);
		if (!result) throw new Error("Expected at least one row.");
		return result;
	}

	/**
	 * Returns the first row or `undefined` if there is none. Throws an `Error` if multiple rows are returned.
	 * @param query The query to execute.
	 */
	public async singleOrUndefined<TRow extends Row>(query: Query<TRow, any>): Promise<MapOutType<TRow> | undefined> {
		if (query instanceof RetrievalQuery)
			query = query.limit(2);
		const rows = await this.exec(query);
		if (rows.length === 0) return undefined;
		if (rows.length >= 2) throw new Error("More than one row returned.");
		return rows[0];
	}

	/**
	 * Returns the first row. Throws an `Error` if no or multiple rows are returned.
	 * @param query The query to execute.
	 */
	public async single<TRow extends Row>(query: Query<TRow, any>): Promise<MapOutType<TRow>> {
		if (query instanceof RetrievalQuery)
			query = query.limit(2);
		const rows = await this.exec(query);
		if (rows.length === 0) throw new Error("No row found.");
		if (rows.length >= 2) throw new Error("More than one row returned.");
		return rows[0];
	}

	public async firstOrUndefinedValue<TRow extends Row, TColumn extends keyof TRow>(query: Query<TRow, TColumn>): Promise<GetOutType<TRow[TColumn]> | undefined> {
		const row = await this.firstOrUndefined(query);
		if (!row) return undefined;
		return row[query.singleColumn];
	}

	public async firstValue<TRow extends Row, TColumn extends keyof TRow>(query: Query<TRow, TColumn>): Promise<GetOutType<TRow[TColumn]>> {
		const row = await this.first(query);
		return row[query.singleColumn];
	}

	public async singleValue<TRow extends Row, TColumn extends keyof TRow>(query: Query<TRow, TColumn>): Promise<GetOutType<TRow[TColumn]>> {
		const row = await this.single(query);
		return row[query.singleColumn];
	}

	public async singleOrUndefinedValue<TRow extends Row, TColumn extends keyof TRow>(query: Query<TRow, TColumn>): Promise<GetOutType<TRow[TColumn]> | undefined> {
		const row = await this.singleOrUndefined(query);
		if (!row) return undefined;
		return row[query.singleColumn];
	}
}

export class TransactingQueryService extends DbQueryInterface {
	private _isTransactionOpen: boolean = true;

	/**
	 * Checks whether the transaction has been closed, i.e. whether it has been rolled back or committed.
	 */
	public get isTransactionOpen(): boolean { return this._isTransactionOpen; }

	public exec<TRow extends Row>(query: Query<TRow, any>): Promise<MapOutType<TRow>[]>;
	public exec<TRow extends Row>(statement: SqlStatement): Promise<void>;
	public exec<TRow extends Row>(statement: SqlStatement): Promise<MapOutType<TRow>[]> | Promise<void> {
		if (!this._isTransactionOpen) throw new Error(`Could not execute statement '${statement}': Transaction already has been either committed or rolled back.`);
		return super.exec(statement);
	}

	/**
	 * Rolls the transaction back and closes the transaction.
	 */
	public async rollback() {
		await this.exec(new RollbackTransactionStatement());
		this._isTransactionOpen = false;
	}

	/**
	 * Commits the changes and closes the transaction.
	 */
	public async commit() {
		await this.exec(new CommitTransactionStatement());
		this._isTransactionOpen = false;
	}
}


export class DbConnection extends DbQueryInterface {
	constructor(protected readonly queryService: DbQueryService) { super(queryService); }

	/**
	 * Runs the `scope` callback within a transaction and returns its result.
	 * The transaction will be committed automatically if the transaction has not been closed after the promise returned by the `scope` callback resolves.
	 * The transaction will be rolled back if the promise rejects and the transaction has not been closed.
	 * @param scope A callback that gets a query interface which runs in a new transaction.
	 */
	public transaction<T>(scope: (queryInterface: TransactingQueryService) => Promise<T>): Promise<T>;
	public transaction<T>(options: { isolationLevel?: IsolationLevel }, scope: (queryInterface: TransactingQueryService) => Promise<T>): Promise<T>;
	public async transaction<T>(
			scopeOrOptions: { isolationLevel?: IsolationLevel }|((queryInterface: TransactingQueryService) => Promise<T>),
			scope?: (queryInterface: TransactingQueryService) => Promise<T>): Promise<T> {
		
		const actualScope = (typeof scopeOrOptions === "object") ? scope : scopeOrOptions;
		const options = (typeof scopeOrOptions === "object") ? scopeOrOptions : { isolationLevel: undefined };

		if (actualScope === undefined) throw new Error("No scope given.");

		return this.queryService.getExclusiveQueryService(async s => {
			const queryInterface = new TransactingQueryService(s);
			await queryInterface.exec(new StartTransactionStatement(options.isolationLevel));
			let error = undefined;
			let result: { success: true, result: T } | { success: false, error: any };
			try {
				result = { success: true, result: await actualScope(queryInterface) };
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
