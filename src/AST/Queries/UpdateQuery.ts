import {
	FromItem, ImplicitColumns, FromFactor,
	FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin, FromFactorCrossJoin
} from "../FromFactor";
import { Table } from "../Table";
import { Expression, ExpressionOrValue, AllExpression, toCondition, and, normalize } from "../Expressions";
import { Query } from "./Query";
import { NmdExpr, Simplify, NmdExprToImplctColumn, resolveColumnReference, handleSelect, Constructable } from "./Common";
import { JoinMixin } from "./JoinMixin";
import { WhereMixin } from "./WhereMixin";

export function update<T extends ImplicitColumns>(table: FromItem<T> & Table<any, any>): UpdateQuery<T, {}, T> {
	return new UpdateQuery<T, {}, T>(table);
}
export class UpdateQuery<TColumns extends ImplicitColumns, TReturningColumns extends ImplicitColumns, TFromTblCols extends ImplicitColumns>
	extends JoinMixin(WhereMixin<Constructable<Query<TReturningColumns>>, TColumns>(Query)) {

	private readonly _table: FromItem<TColumns> & Table<any, any>;

	private _updatedColumns: {[TColumnName in keyof TFromTblCols]?: Expression<TFromTblCols[TColumnName]>} = {};

	constructor(table: FromItem<TColumns> & Table<any, any>) {
		super();
		this.lastFromItem = table;
		this._table = table;
	}

	public getState() {
		return Object.assign({
			whereCondition: this._whereCondition,
			updatedColumns: this._updatedColumns,
			table: this._table,
			from: this._from
		}, super.getState());
	}

	public from<TTableColumns>(table: FromItem<TTableColumns>): UpdateQuery<TColumns, TReturningColumns, TTableColumns> {
		this._from = FromFactor.crossJoin(this._from, table);
		this.lastFromItem = table as any;
		return this as any;
	}

	public set<TColumn extends keyof TColumns>(column: TColumn, value: ExpressionOrValue<TColumns[TColumn]>): this;
	public set(obj: {[TColumnName in keyof TColumns]?: ExpressionOrValue<TColumns[TColumnName]>}): this;
	public set(columnOrObject: string | object, value?: ExpressionOrValue<any>): this {
		if (typeof columnOrObject === "string") {
			const expr = normalize(value);
			this._updatedColumns[columnOrObject] = expr;
		}
		else {
			for (const [name, value] of Object.entries(columnOrObject)) {
				const expr = normalize(value);
				this._updatedColumns[name] = expr;
			}
		}

		return this;
	}

	/**
	 * Selects all columns from the given table.
	 */
	public returning<T extends ImplicitColumns>(table: AllExpression<T>)
		: UpdateQuery<TColumns, Simplify<TReturningColumns & {[TName in keyof T]: T[TName]}>, TFromTblCols>;

	public returning<T1 extends NmdExpr>(expr1: T1)
		: UpdateQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1>>, TFromTblCols>;
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2)
		: UpdateQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2>>, TFromTblCols>;
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3)
		: UpdateQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3>>, TFromTblCols>;

	/**
	 * Selects given columns from the current table.
	 */
	public returning<TColumnNames extends keyof TFromTblCols>(...columns: TColumnNames[])
		: UpdateQuery<TColumns, Simplify<TReturningColumns & {[TName in TColumnNames]: TFromTblCols[TColumnNames]}>, TFromTblCols>;
	public returning(...args: ((keyof TFromTblCols) | NmdExpr | AllExpression<any>)[]): any {
		handleSelect(this.lastFromItem, this.columns as any, this.selectedColumns, ...args);
		return this;
	}
}