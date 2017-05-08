import { toObject } from '../Helpers';
import { RetrievalQuery } from '../AST/Queries/RetrievalQuery';
import { AnyType, MapOutType } from '../AST/Types';
import { SqlStatement } from '../AST/SqlStatement';
import pg = require('pg');
import { PostgreSqlGenerator } from "./PostgreSqlGenerator";
import { SqlGeneratorOptions } from "../SqlGenerator";
import { Query } from "../AST/Queries/Query";
import { DbQueryService, SimpleDbQueryService } from "../DbConnection";
import { EventEmitter, ISubscribable } from "hediet-framework/api/events";
import { Deferred } from "hediet-framework/api/synchronization";

/* TODO
export class PostgreQueryServiceFactory {
	constructor(private readonly pgModule: typeof pg) {
		
	}

	public createQueryService(connectionData: any) {

	}
}*/

export class PostgreQueryService implements DbQueryService {
	public readonly sqlGenerator: PostgreSqlGenerator;
	private readonly onSqlStatementEmitter = new EventEmitter<this, { sql: string, parameters: any[], query: SqlStatement, resultRows: Promise<any[]> }>();
	public readonly onSqlStatement = this.onSqlStatementEmitter.asEvent();

	constructor(private readonly pool: pg.Pool, sqlGeneratorOptions: SqlGeneratorOptions = {}) {
		this.sqlGenerator = new PostgreSqlGenerator(sqlGeneratorOptions);
	}

	public exec<TRow>(query: Query<TRow, any>): Promise<MapOutType<TRow>[]>;
	public exec<TRow>(statement: SqlStatement): Promise<void>;
	public exec(query: SqlStatement): Promise<any> {
		return this.execClient(query);
	}

	private async execClient(query: SqlStatement, client?: pg.Client): Promise<any> {
		const { sql:queryText, parameters } = this.sqlGenerator.toSql(query);
		const resultRows = new Deferred<any[]>();
		this.onSqlStatementEmitter.emit(this, { sql: queryText, parameters: parameters, query: query, resultRows: resultRows.value });

		const result = await (client ? client.query(queryText, parameters) : this.pool.query(queryText, parameters));

		let updatedRows = result.rows;

/*
		if (query instanceof RetrievalQuery) {
			const cols = query.getState().returningColumns;
			updatedRows = updatedRows.map(row => {
				const result = {} as any;
				for (const prop of row) {
					const val = row[prop];
					const type = cols[prop] as AnyType;
					result[prop] = type.deserialize(val);
				}
			});
		}
*/

		resultRows.setValue(updatedRows);
		return updatedRows;
	}

	public getExclusiveQueryService<T>(scope: (service: SimpleDbQueryService) => Promise<T>): Promise<T> {
		return new Promise((res, rej) => this.pool.connect((err, client, done) => {
			if (err) { rej(err); return; }

			const service = new this.PostgreExclusiveQueryService(client, this);
			scope(service)
				.then(result => {
					done();
					res(result);
				})
				.catch(err => {
					done();
					rej(err);
				});
		}));
	}

	private readonly PostgreExclusiveQueryService = class PostgreExclusiveQueryService implements SimpleDbQueryService {
		constructor(private readonly client: pg.Client, private readonly queryService: PostgreQueryService) {}

		public exec<TColumns>(query: Query<TColumns, any>): Promise<TColumns[]>;
		public exec<TColumns>(statement: SqlStatement): Promise<void>;
		public async exec(query: SqlStatement): Promise<any> {
			return this.queryService.execClient(query, this.client);
		}
	};
}
