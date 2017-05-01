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
	constructor(protected readonly options: SqlGeneratorOptions = {}) {}

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

		if (statement instanceof StartTransactionStatement) return "BEGIN";
		if (statement instanceof CommitTransactionStatement) return "COMMIT";
		if (statement instanceof RollbackTransactionStatement) return "ROLLBACK";

		throw new Error(`Unsupported query: ${statement}`);
	}

	protected createExpressionContext(from: FromFactor|undefined, context: Context): ExpressionContext {
		if (!this.options.shortenColumnNameIfUnambigous)
			return { isColumnNameUnambigous: name => false, resolveNamedExpression: false, context };

		let allColumns: Exprs.Column<any, any>[] = [];
		if (from) {
			const allFromFactors = FromFactor.getAllFromFactors(from);

			allColumns = allColumns.concat(
				...allFromFactors.map(f => Object.values(f.$columns)));
		}
		const set = new Set<string>();
		const duplicates = new Set<string>();
		for (const col of allColumns) {
			if (set.has(col.name)) duplicates.add(col.name);
			else set.add(col.name);
		}

		return { isColumnNameUnambigous: name => !duplicates.has(name), resolveNamedExpression: false, context };
	}

	protected transformValuesQueryToSql(query: ValuesQuery<any>, context: Context): string {
		const first = query.values[0]; // todo exception
		let sql = "VALUES ";

		const expressionContext: ExpressionContext = { isColumnNameUnambigous: c => true, resolveNamedExpression: true, context };

		sql += query.values.map(v => 
			`(${Object.keys(first).map(k => this.escapeValue(new Exprs.ValueExpression(v[k]), expressionContext)).join(", ")})`
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
				sql += data.values.map(v => `(${columnNames.map(c => this.escapeValue(Exprs.val(v[c]), expressionContext)).join(", ")})`).join(", ");
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
		
		const expressionContext = this.createExpressionContext(data.using, context);

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
		
		const expressionContext = this.createExpressionContext(data.from, context);

		sql += " SET " + Object.entries(data.updatedColumns).map(([name, value]: [string, Exprs.Expression<any>]) => 
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

		const expressionContext = this.createExpressionContext(data.from, context);

		if (data.selected.length > 0) {
			sql += " " + this.toSelectStatementStr(data.selected, expressionContext);
		}

		if (data.from) {
			sql += ` FROM ${this.fromToSql(data.from, expressionContext)}`;
		}

		if (data.whereCondition) {
			sql += ` WHERE ${this.expressionToSql(data.whereCondition, expressionContext)}`;
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

	protected toSelectStatementStr(selected: (Exprs.NamedExpression<any, any>|Exprs.AllExpression<any>)[], context: ExpressionContext): string {
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

	protected referToFromItem(fromItem: FromItem<any>): string {
		if (fromItem instanceof Table) {
			let result = "";
			if (fromItem.$name.schema) result += this.quoteSchemaName(fromItem.$name.schema) + ".";
			result += this.quoteTableName(fromItem.$name.name);
			return result;
		}
		else if (fromItem instanceof NamedFromItem || fromItem instanceof QueryFromItem) {
			return this.quoteTableName(fromItem.$name);
		}

		throw "Unsupported";
	}

	private fromToSql(f: FromFactor, context: ExpressionContext): string {
		if (f instanceof Table) {
			return this.referToFromItem(f);
		}
		else if (f instanceof NamedFromItem) {
			const oldName = this.referToFromItem(f.fromItem);
			const newName = this.referToFromItem(f);

			let sql = `${oldName} AS ${newName}`;
			if (isCastToColumns(f))
				sql += `(${Object.keys(f.$columns).join(", ")})`;
			return sql;
		}
		else if (f instanceof QueryFromItem) {
			const newName = this.referToFromItem(f);

			let sql = `(${this.transformToSql(f.query, context.context)}) AS ${newName}`;
			if (isCastToColumns(f))
				sql += `(${Object.keys(f.$columns).join(", ")})`;
			return sql;
		}
		else if (f instanceof FromFactorAbstractJoin) {
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
			};
		}

		throw new Error(`Unknown From Factor '${f}'`);
	}

	protected escapeValue(expr: Exprs.ValueExpression<any>, context: ExpressionContext): string {
		const val = expr.value;

		context.context.parameters.push(val);
		return "?";
	}

	private expressionToSql(e: Exprs.Expression<any>, context: ExpressionContext, parentPrecedenceLevel: number = 1000): string {
		const result = this.expressionToSqlAutoParenthesis(e, context);
		if (e.precedenceLevel > parentPrecedenceLevel)
			return `(${result})`;
		return result;
	}

	private expressionToSqlAutoParenthesis(e: Exprs.Expression<any>, context: ExpressionContext): string {
		if (e instanceof Exprs.NamedExpressionWrapper) {
			if (context.resolveNamedExpression)
				return this.expressionToSql(e.expression, context);
			else
				return this.quoteColumnName(e.name);
		}
		if (e instanceof Exprs.ValueExpression) {
			return this.escapeValue(e, context);
		}
		if (e instanceof Exprs.Column) {
			const columnName = this.quoteColumnName(e.name);
			if (context.isColumnNameUnambigous(e.name))
				return columnName;
			
			const tableName = this.referToFromItem(e.fromItem);
			return `${tableName}.${columnName}`;
		}
		if (e instanceof Exprs.AllExpression) {
			const tableName = this.referToFromItem(e.fromItem);
			return `${tableName}.*`;
		}
		if (e instanceof Exprs.BinaryOperatorExpression) {
			const operator = e.operator;

			const left = this.expressionToSql(e.left, context, e.precedenceLevel);
			const right = this.expressionToSql(e.right, context, e.precedenceLevel);

			return `${left} ${operator} ${right}`;
		}
		if (e instanceof Exprs.KnownFunctionInvocation) {
			const functionName = e.functionName.toUpperCase();
			const args = e.args.map(arg => this.expressionToSql(arg, context)).join(", ");
			return `${functionName}(${args})`;
		}
		if (e instanceof Exprs.RetrievalQueryAsExpression) {
			return `(${this.transformToSql(e.query, context.context)})`;
		}
		if (e instanceof Exprs.IsInValuesExpression) {
			if (e.values.length === 0)
				return this.expressionToSql(Exprs.val(false), context, e.precedenceLevel);
			const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
			return `${arg} IN (${e.values.map(v => this.expressionToSql(v, context)).join(", ")})`;
		}
		if (e instanceof Exprs.IsInQueryExpression) {
			const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
			return `${arg} IN (${this.transformToSql(e.query, context.context)})`;
		}
		if (e instanceof Exprs.LikeExpression) {
			const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
			return `${arg} LIKE ${this.expressionToSql(e.like, context, e.precedenceLevel)}`;
		}
		if (e instanceof Exprs.NotExpression) {
			const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
			return `NOT ${arg}`
		}
		if (e instanceof Exprs.IsNullExpression) {
			const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
			return `${arg} IS NULL`;
		}
		if (e instanceof Exprs.IsNotNullExpression) {
			const arg = this.expressionToSql(e.argument, context, e.precedenceLevel);
			return `${arg} IS NOT NULL`;
		}
		throw "not implemented";
	}
}