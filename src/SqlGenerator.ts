import { UnionQuery } from './AST/Queries/RetrievalQuery';
import { ValuesQuery } from './AST/Queries/ValuesQuery';
import { InsertQuery } from './AST/Queries/InsertQuery';
import { UpdateQuery } from './AST/Queries/UpdateQuery';
import { DeleteQuery } from './AST/Queries/DeleteQuery';
import { SqlStatement, CommitTransactionStatement, RollbackTransactionStatement, StartTransactionStatement } from './AST/SqlStatement';
import {
	FromFactor,
	FromFactorAbstractConditionalJoin,
	FromFactorAbstractJoin,
	FromFactorCrossJoin,
	FromFactorFullJoin,
	FromFactorInnerJoin,
	FromFactorLeftJoin,
	FromItem,
	isCastToColumns,
	NamedFromItem,
	QueryFromItem
} from './AST/FromFactor';
import { Query } from "./AST/Queries/Query";
import { SelectQuery } from "./AST/Queries/SelectQuery";
import * as Exprs from './AST/Expressions';
import { Table, TableName } from "./AST/Table";
import { isOrderingAsc } from "./AST/Ordering";
import { objectValues, objectEntries, DynamicDispatcher } from "./Helpers";
import { AnyType } from "./index";

export interface SqlGeneratorOptions {
	shortenColumnNameIfUnambigous?: boolean;
	skipQuotingIfNotRequired?: boolean;
}


export interface ExpressionContext {
	isColumnNameUnambigous(name: string): boolean;
	resolveNamedExpression: boolean;
	context: Context;
}

export interface Context {
	parameters: any[];
}

// IMPORTANT IMPLEMENTATION NOTICE: expressions must be generated in the order they appear in the final sql string!
// Otherwise prepared statements with parameters get messed up.

export abstract class SqlGenerator {
	constructor(protected readonly options: SqlGeneratorOptions = {}) { }

	public toSql(statement: SqlStatement): { sql: string, parameters: any[] } {
		const context: Context = { parameters: [] };
		const sql = this.transformToSql(statement, context);
		return { sql, parameters: context.parameters };
	}

	protected transformToSql(statement: SqlStatement, context: Context): string {
		if (statement instanceof SelectQuery) return this.transformSelectQueryToSql(statement, context);
		if (statement instanceof UpdateQuery) return this.transformUpdateQueryToSql(statement, context);
		if (statement instanceof InsertQuery) return this.transformInsertQueryToSql(statement, context);
		if (statement instanceof DeleteQuery) return this.transformDeleteQueryToSql(statement, context);
		if (statement instanceof ValuesQuery) return this.transformValuesQueryToSql(statement, context);

		if (statement instanceof UnionQuery) return this.transformUnionQueyToSql(statement, context);

		if (statement instanceof StartTransactionStatement) return "BEGIN";
		if (statement instanceof CommitTransactionStatement) return "COMMIT";
		if (statement instanceof RollbackTransactionStatement) return "ROLLBACK";

		throw new Error(`Unsupported query: ${statement}`);
	}

	protected createExpressionContext(froms: (FromFactor | undefined)[], context: Context): ExpressionContext {
		if (!this.options.shortenColumnNameIfUnambigous)
			return { isColumnNameUnambigous: name => false, resolveNamedExpression: false, context };

		let allColumns: Exprs.Column<any, any>[] = [];
		for (const from of froms) {
			if (!from) continue;

			const allFromFactors = FromFactor.getAllFromFactors(from);

			allColumns = allColumns.concat(
				...allFromFactors.map(f => objectValues(f.$columns)));
		}
		const set = new Set<string>();
		const duplicates = new Set<string>();
		for (const col of allColumns) {
			if (set.has(col.name)) duplicates.add(col.name);
			else set.add(col.name);
		}

		return { isColumnNameUnambigous: name => !duplicates.has(name), resolveNamedExpression: false, context };
	}

	protected transformUnionQueyToSql(query: UnionQuery<any, any>, context: Context): string {
		const query1Sql = this.transformToSql(query.query1, context);
		const query2Sql = this.transformToSql(query.query2, context);

		return `(${query1Sql}) UNION (${query2Sql})`;
	}

	protected transformValuesQueryToSql(query: ValuesQuery<any>, context: Context): string {
		const columns = query.columns;

		if (query.values.length === 0) {
			return `SELECT ${Object.keys(columns).map(k => "null").join(", ")} WHERE false`;
		}

		let sql = "VALUES ";

		const expressionContext: ExpressionContext = { isColumnNameUnambigous: c => true, resolveNamedExpression: true, context };

		sql += query.values.map(v =>
			`(${objectEntries(columns).map(([name, type]) => this.escapeValue(new Exprs.ValueExpression(type, v[name]), expressionContext)).join(", ")})`
		).join(", ");

		return sql;
	}

	protected transformInsertQueryToSql(query: InsertQuery<any, any, any>, context: Context): string {
		const data = query.getState();
		let sql = `INSERT INTO ${this.referToFromItem(data.table)}`;

		const expressionContext: ExpressionContext = { isColumnNameUnambigous: c => true, resolveNamedExpression: true, context };

		if (Array.isArray(data.values)) {
			if (data.values.length === 0) {
				sql += ` (SELECT null WHERE false)`;
			}
			else {
				const firstRow = data.values[0];
				const columnNames = Object.keys(firstRow);
				
				for (const selectedCol of columnNames) {
					if (!(selectedCol in data.table.$columns))
						throw new Error(`Column '${selectedCol}' does not exist on table '${data.table}'.`);
				}

				sql += `(${columnNames.map(c => this.quoteColumnName(c)).join(", ")}) VALUES `;
				sql += data.values.map(v => `(${columnNames.map(colName => 
					this.escapeValue(Exprs.val(v[colName], data.table.$columns[colName].type), expressionContext)).join(", ")})`).join(", ");
			}
		}
		else {
			const s = data.values.getState();
			const columnNames = s.selected.map(selectedCol => {
				if (selectedCol instanceof Exprs.AllExpression)
					throw new Error("AllExpressions in insert into query are not supported.");
				if (!(selectedCol.name in data.table.$columns))
					throw new Error(`Column '${selectedCol.name}' does not exist on table '${data.table}'.`);
				return selectedCol.name;
			});

			sql += `(${columnNames.map(c => this.quoteColumnName(c)).join(", ")}) ${this.transformToSql(data.values, context)}`;
		}

		if (data.selected.length > 0) {
			sql += " RETURNING " + this.toSelectStatementStr(data.selected, expressionContext);
		}

		return sql;
	}

	protected transformDeleteQueryToSql(query: DeleteQuery<any, any, any>, context: Context): string {
		const data = query.getState();
		let sql = `DELETE FROM ${this.referToFromItem(data.table)}`;

		const expressionContext = this.createExpressionContext([data.using, data.table], context);

		if (data.using) {
			sql += ` USING ${this.fromToSql(data.using, expressionContext)}`;
		}

		if (!data.whereCondition) throw new Error("Delete Queries must have a where condition.");
		sql += ` WHERE ${this.expressionToSql(data.whereCondition, expressionContext)}`;

		if (data.selected.length > 0) {
			sql += " RETURNING " + this.toSelectStatementStr(data.selected, expressionContext);
		}

		return sql;
	}

	protected transformUpdateQueryToSql(query: UpdateQuery<any, any, any, any>, context: Context): string {
		const data = query.getState();
		let sql = `UPDATE ${this.referToFromItem(data.table)}`;

		const expressionContext = this.createExpressionContext([data.from, data.table], context);

		sql += " SET " + objectEntries(data.updatedColumns).map(([name, value]: [string, Exprs.Expression<any>]) =>
			`${this.quoteColumnName(name)} = ${this.expressionToSql(value, expressionContext)}`
		).join(", ");

		if (data.from) {
			sql += ` FROM ${this.fromToSql(data.from, expressionContext)}`;
		}

		if (!data.whereCondition) throw new Error("Update Queries must have a where condition.");
		sql += ` WHERE ${this.expressionToSql(data.whereCondition, expressionContext)}`;

		if (data.selected.length > 0) {
			sql += " RETURNING " + this.toSelectStatementStr(data.selected, expressionContext);
		}

		return sql;
	}

	protected transformSelectQueryToSql(query: SelectQuery<any, any, any>, context: Context): string {
		const data = query.getState();
		let sql = "SELECT";

		const expressionContext = this.createExpressionContext([data.from], context);

		if (data.selected.length > 0) {
			sql += " " + this.toSelectStatementStr(data.selected, expressionContext);
		}

		if (data.from) {
			sql += ` FROM ${this.fromToSql(data.from, expressionContext)}`;
		}

		if (data.whereCondition) {
			sql += ` WHERE ${this.expressionToSql(data.whereCondition, expressionContext)}`;
		}

		if (data.groupBys.length > 0) {
			const exprCt = { isColumnNameUnambigous: expressionContext.isColumnNameUnambigous, resolveNamedExpression: false, context: context };
			const statements = data.groupBys.map(e => this.expressionToSql(e, exprCt)).join(", ");
			sql += ` GROUP BY ${statements}`;
		}

		if (data.havingCondition) {
			const havingCondition = this.expressionToSql(data.havingCondition,
				{ isColumnNameUnambigous: expressionContext.isColumnNameUnambigous, resolveNamedExpression: true, context: context });
			sql += ` HAVING ${havingCondition}`;
		}

		if (data.orderBys.length > 0) {
			sql += " ORDER BY " + data.orderBys.map(d => isOrderingAsc(d) ? this.expressionToSql(d.asc, expressionContext) : (this.expressionToSql(d.desc, expressionContext) + " DESC"));
		}

		if (data.limit) {
			sql += " LIMIT " + this.expressionToSql(data.limit, expressionContext);
		}
		if (data.offset) {
			sql += " OFFSET " + this.expressionToSql(data.offset, expressionContext);
		}

		return sql;
	}

	protected toSelectStatementStr(selected: (Exprs.NamedExpression<string, AnyType> | Exprs.AllExpression<object>)[], context: ExpressionContext): string {
		return selected.map(expr => {
			if (expr instanceof Exprs.NamedExpressionWrapper) {
				return `${this.expressionToSql(expr.expression, context)} AS ${this.quoteColumnName(expr.name)}`;
			}
			return this.expressionToSql(expr, context);
		}).join(", ");
	}

	protected quoteSchemaName(name: string): string {
		return this.quoteSchemaOrTableOrColumnName(name);
	}

	protected quoteTableName(name: string): string {
		return this.quoteSchemaOrTableOrColumnName(name);
	}

	protected quoteColumnName(name: string): string {
		return this.quoteSchemaOrTableOrColumnName(name);
	}

	protected abstract quoteSchemaOrTableOrColumnName(name: string): string;

	protected referToFromItem(fromItem: FromItem<any>, includeSchema: boolean = true): string {
		if (fromItem instanceof Table) {
			let result = "";
			if (fromItem.$name.schema && includeSchema) result += this.quoteSchemaName(fromItem.$name.schema) + ".";
			result += this.quoteTableName(fromItem.$name.name);
			return result;
		}
		else if (fromItem instanceof NamedFromItem || fromItem instanceof QueryFromItem) {
			return this.quoteTableName(fromItem.$name);
		}

		throw "Unsupported";
	}

	private fromFactorDispatcherInitialized = false;
	private fromFactorDispatcher = new DynamicDispatcher<FromFactor, ExpressionContext, string>();

	private fromToSql(f: FromFactor, context: ExpressionContext): string {
		if (!this.fromFactorDispatcherInitialized) {
			this.fromFactorDispatcherInitialized = true;

			this.fromFactorDispatcher
				.register(Table, (f, context) => {
					return this.referToFromItem(f);
				})
				.register(NamedFromItem, (f, context) => {
					const oldName = this.referToFromItem(f.fromItem);
					const newName = this.referToFromItem(f);

					let sql = `${oldName} AS ${newName}`;
					if (isCastToColumns(f))
						sql += `(${Object.keys(f.$columns).map(n => this.quoteColumnName(n)).join(", ")})`;
					return sql;
				})
				.register(QueryFromItem, (f, context) => {
					const newName = this.referToFromItem(f);

					let sql = `(${this.transformToSql(f.query, context.context)}) AS ${newName}`;
					if (isCastToColumns(f))
						sql += `(${Object.keys(f.$columns).map(n => this.quoteColumnName(n)).join(", ")})`;
					return sql;
				})
				.register(FromFactorAbstractJoin, (f, context) => {
					const left = this.fromToSql(f.leftArg, context);
					const right = this.fromToSql(f.rightArg, context);

					let sql: string;
					if (f instanceof FromFactorAbstractConditionalJoin) {
						const condition = this.expressionToSql(f.joinCondition, context);
						let join: string;
						if (f instanceof FromFactorCrossJoin)
							join = "CROSS JOIN";
						else if (f instanceof FromFactorFullJoin)
							join = "FULL JOIN";
						else if (f instanceof FromFactorInnerJoin)
							join = "JOIN";
						else if (f instanceof FromFactorLeftJoin)
							join = "LEFT JOIN";
						else throw new Error("Unsupported join");

						return `${left} ${join} ${right} ON ${condition}`;
					}
					else if (f instanceof FromFactorCrossJoin) {
						return `${left} CROSS JOIN ${right}`;
					}
					else throw new Error("Unknown join.");
				});
		}

		return this.fromFactorDispatcher.dispatch(f, context);
	}

	protected escapeValue(expr: Exprs.ValueExpression<AnyType>, context: ExpressionContext): string {
		const val = expr.value;
		const serialized = expr.type.serialize(val);

		context.context.parameters.push(serialized);
		return "?";
	}

	private expressionToSql(e: Exprs.Expression<AnyType>, context: ExpressionContext, parentPrecedenceLevel: number = 1000): string {
		const result = this.expressionToSqlAutoParenthesis(e, context);
		if (e.precedenceLevel > parentPrecedenceLevel)
			return `(${result})`;
		return result;
	}

	private expressionDispatcherInitialized = false;
	private expressionDispatcher = new DynamicDispatcher<Exprs.Expression<AnyType>, ExpressionContext, string>();

	private expressionToSqlAutoParenthesis(e: Exprs.Expression<AnyType>, context: ExpressionContext): string {
		if (!this.expressionDispatcherInitialized) {
			this.expressionDispatcherInitialized = true;

			this.expressionDispatcher
				.register(Exprs.NamedExpressionWrapper, (e, context) => {
					if (context.resolveNamedExpression)
						return this.expressionToSql(e.expression, context);
					else
						return this.quoteColumnName(e.name);
				})
				.register(Exprs.ValueExpression, (e, context) => this.escapeValue(e, context))
				.register(Exprs.Column, (e, context) => {
					const columnName = this.quoteColumnName(e.name);
					if (context.isColumnNameUnambigous(e.name))
						return columnName;

					const tableName = this.referToFromItem(e.fromItem);
					return `${tableName}.${columnName}`;
				})
				.register(Exprs.FromItemExpression, (e, context) => {
					const tableName = this.referToFromItem(e.fromItem, false);
					return tableName;
				})
				.register(Exprs.AllExpression, (e, context) => {
					const tableName = this.referToFromItem(e.fromItem);
					return `${tableName}.*`;
				})
				.register(Exprs.BinaryOperatorExpression, (e, context) => {
					const operator = e.operator;

					const left = this.expressionToSql(e.left, context, e.precedenceLevel);
					const right = this.expressionToSql(e.right, context, e.precedenceLevel);

					return `${left} ${operator} ${right}`;
				})
				.register(Exprs.KnownFunctionInvocation, (e, context) => {
					const functionName = e.functionName.toUpperCase();
					const args = e.args.map(arg => this.expressionToSql(arg, context)).join(", ");
					return `${functionName}(${args})`;
				})
				.register(Exprs.RetrievalQueryAsExpression, (e, context) => `(${this.transformToSql(e.query, context.context)})`)
				.register(Exprs.IsInValuesExpression, (e, context) => {
					if (e.values.length === 0)
						return this.expressionToSql(Exprs.val(false, true), context, e.precedenceLevel);
					const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
					return `${arg} IN (${e.values.map(v => this.expressionToSql(v, context)).join(", ")})`;
				})
				.register(Exprs.IsInQueryExpression, (e, context) => {
					const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
					return `${arg} IN (${this.transformToSql(e.query, context.context)})`;
				})
				.register(Exprs.LikeExpression, (e, context) => {
					const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
					return `${arg} LIKE ${this.expressionToSql(e.like, context, e.precedenceLevel)}`;
				})
				.register(Exprs.NotExpression, (e, context) => {
					const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
					return `NOT ${arg}`
				})
				.register(Exprs.IsNullExpression, (e, context) => {
					const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
					return `${arg} IS NULL`;
				})
				.register(Exprs.IsNotNullExpression, (e, context) => {
					const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
					return `${arg} IS NOT NULL`;
				})
				.register(Exprs.JsonPropertyAccess, (e, context) => {
					const arg = this.expressionToSql(e.expression, context, e.precedenceLevel);
					return `${arg}->${this.escapeValue(Exprs.val(e.key, true), context)}`;
				})
				.register(Exprs.CastExpression, (e, context) => {
					if (e.isHiddenCast)
						return this.expressionToSql(e.expression, context, e.precedenceLevel);
					
					return this.expressionToSql(e.expression, context) + "::" + e.type.name;
				});
		}

		return this.expressionDispatcher.dispatch(e, context);
	}
}