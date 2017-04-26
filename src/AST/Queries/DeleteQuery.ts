import { FromItem, ImplicitColumns, FromFactor } from "../FromFactor";
import { Table } from "../Table";
import { ExpressionOrValue, AllExpression } from "../Expressions";
import { Query } from "./Query";
import { NmdExpr, Simplify, NmdExprToImplctColumn, resolveColumnReference, handleSelect, Constructable } from "./Common";
import { JoinMixin } from "./JoinMixin";
import { WhereMixin } from "./WhereMixin";
export function deleteFrom<T extends ImplicitColumns>(table: FromItem<T> & Table<any, any>): DeleteQuery<T, {}> {
	return new DeleteQuery<T, {}>(table);
}

export class DeleteQuery<TColumns extends ImplicitColumns, TReturningColumns extends ImplicitColumns> 
		extends JoinMixin(WhereMixin<Constructable<Query<TReturningColumns>>, TColumns>(Query)) {

	constructor(private readonly table: FromItem<any> & Table<any, any>) {
		super();
		this.lastFromItem = table;
	}

	public getState() {
		return Object.assign({
			table: this.table,
			using: this._from,
			whereCondition: this._whereCondition
		}, super.getState());
	}

	public using<TTableColumns>(table: FromItem<TTableColumns>): DeleteQuery<TTableColumns, TReturningColumns> {
		this._from = FromFactor.crossJoin(this._from, table);
		this.lastFromItem = table as any;
		return this as any;
	}

	/**
	 * Selects all columns from the given table.
	 */
	public returning<T extends ImplicitColumns>(table: AllExpression<T>)
		: DeleteQuery<TColumns, Simplify<TReturningColumns & {[TName in keyof T]: T[TName]}>>;

	public returning<T1 extends NmdExpr>(expr1: T1)
		: DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1>>>;
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2)
		: DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2>>>;
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3)
		: DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3>>>;

	/**
	 * Selects given columns from the current table.
	 */
	public returning<TColumnNames extends keyof TColumns>(...columns: TColumnNames[])
		: DeleteQuery<TColumns, Simplify<TReturningColumns & {[TName in TColumnNames]: TColumns[TColumnNames]}>>;
	public returning(...args: ((keyof TColumns) | NmdExpr | AllExpression<any>)[]): any {
		handleSelect(this.lastFromItem, this.columns as any, this.selectedColumns, ...args);
		return this;
	}
}
