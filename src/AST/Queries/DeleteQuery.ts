import { FromItem, ImplicitColumns, FromFactor } from "../FromFactor";
import { Table } from "../Table";
import { ExpressionOrValue, AllExpression, NamedExpression, Expression, NamedExpressionNameOf } from "../Expressions";
import { Query, NoColumnsSelected, MoreThanOneColumnSelected, SingleColumn } from "./Query";
import { NmdExpr, Simplify, NmdExprToImplctColumn, resolveColumnReference, handleSelect, Constructable } from "./Common";
import { JoinMixin, JoinMixinInstance } from "./JoinMixin";
import { WhereMixin, WhereMixinInstance } from "./WhereMixin";
export function deleteFrom<T extends ImplicitColumns>(table: FromItem<T> & Table<any, any>): DeleteQuery<T, {}, NoColumnsSelected> {
	return new DeleteQuery<T, {}, NoColumnsSelected>(table);
}

export class DeleteQuery<TColumns extends ImplicitColumns, TReturningColumns extends ImplicitColumns, TSingleColumn extends SingleColumn<TReturningColumns>>
	extends JoinMixin(WhereMixin<Constructable<Query<TReturningColumns, TSingleColumn>>, TColumns>(Query)) {

	protected _from: FromFactor | undefined = undefined;
	protected _whereCondition: Expression<boolean> | undefined;
	protected lastFromItem: FromItem<TColumns> | undefined;

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

	public using<TTableColumns>(table: FromItem<TTableColumns>): DeleteQuery<TTableColumns, TReturningColumns, TSingleColumn> {
		this._from = FromFactor.crossJoin(this._from, table);
		this.lastFromItem = table as any;
		return this as any;
	}

	/** Selects all columns from the given table. */
	public returning<T extends ImplicitColumns>(table: AllExpression<T>): DeleteQuery<TColumns, Simplify<TReturningColumns & {[TName in keyof T]: T[TName]}>, MoreThanOneColumnSelected>;

	/** Selects a single named expression. */
	public returning<T1 extends NmdExpr>(this: DeleteQuery<TColumns, TReturningColumns, NoColumnsSelected> | void, expr1: T1): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1>>, NamedExpressionNameOf<T1>>;

	/** Selects 1 named expressions. */
	public returning<T1 extends NmdExpr>(expr1: T1): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1>>, MoreThanOneColumnSelected>;

	/** Selects 2 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2>>, MoreThanOneColumnSelected>;

	/** Selects 3 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3>>, MoreThanOneColumnSelected>;

	/** Selects 4 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4>>, MoreThanOneColumnSelected>;

	/** Selects 5 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5>>, MoreThanOneColumnSelected>;

	/** Selects 6 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6>>, MoreThanOneColumnSelected>;

	/** Selects 7 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6> & NmdExprToImplctColumn<T7>>, MoreThanOneColumnSelected>;

	/** Selects 8 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr, T8 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7, expr8: T8): DeleteQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6> & NmdExprToImplctColumn<T7> & NmdExprToImplctColumn<T8>>, MoreThanOneColumnSelected>;

	/** Selects a single column that is currently in scope. */
	public returning<TColumnName extends keyof TColumns>(this: DeleteQuery<TColumns, TReturningColumns, NoColumnsSelected>, column1: TColumnName): DeleteQuery<TColumns, Simplify<TReturningColumns & {[TName in TColumnName]: TColumns[TName]}>, TColumnName>;

	/** Selects columns that are currently in scope. */
	public returning<TColumnNames extends keyof TColumns>(...columns: TColumnNames[]): DeleteQuery<TColumns, Simplify<TReturningColumns & {[TName in TColumnNames]: TColumns[TName]}>, MoreThanOneColumnSelected>;

	public returning(...args: ((keyof TColumns) | NmdExpr | AllExpression<any>)[]): any {
		handleSelect(this.lastFromItem, this.columns as any, this.selectedColumns, args);
		return this;
	}
}
