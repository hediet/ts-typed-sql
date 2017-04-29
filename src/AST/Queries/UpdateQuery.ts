import {
	FromItem, ImplicitColumns, FromFactor,
	FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin, FromFactorCrossJoin
} from "../FromFactor";
import { Table } from "../Table";
import { Expression, ExpressionOrValue, AllExpression, toCondition, and, normalize, NamedExpression, NamedExpressionNameOf } from "../Expressions";
import { Query, SingleColumn, MoreThanOneColumnSelected, NoColumnsSelected } from './Query';
import { NmdExpr, Simplify, NmdExprToImplctColumn, resolveColumnReference, handleSelect, Constructable } from "./Common";
import { JoinMixin } from "./JoinMixin";
import { WhereMixin } from "./WhereMixin";

export function update<T extends ImplicitColumns>(table: FromItem<T> & Table<any, any>): UpdateQuery<T, {}, T, NoColumnsSelected> {
	return new UpdateQuery<T, {}, T, NoColumnsSelected>(table);
}
export class UpdateQuery<TUpdatedColumns extends ImplicitColumns, TReturningColumns extends ImplicitColumns, TFromTblCols extends ImplicitColumns, TSingleColumn extends SingleColumn<TReturningColumns>>
	extends JoinMixin(WhereMixin<Constructable<Query<TReturningColumns, TSingleColumn>>, TUpdatedColumns>(Query)) {

	private readonly _table: FromItem<TUpdatedColumns> & Table<any, any>;

	private _updatedColumns: {[TColumnName in keyof TFromTblCols]?: Expression<TFromTblCols[TColumnName]>} = {};

	constructor(table: FromItem<TUpdatedColumns> & Table<any, any>) {
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

	public from<TTableColumns>(table: FromItem<TTableColumns>): UpdateQuery<TUpdatedColumns, TReturningColumns, TTableColumns, TSingleColumn> {
		this._from = FromFactor.crossJoin(this._from, table);
		this.lastFromItem = table as any;
		return this as any;
	}

	public set<TColumn extends keyof TUpdatedColumns>(column: TColumn, value: ExpressionOrValue<TUpdatedColumns[TColumn]>): this;
	public set(obj: {[TColumnName in keyof TUpdatedColumns]?: ExpressionOrValue<TUpdatedColumns[TColumnName]>}): this;
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

	/** Selects all columns from the given table. */
	public returning<T extends ImplicitColumns>(table: AllExpression<T>): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & {[TName in keyof T]: T[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single named expression. */
	public returning<T1 extends NmdExpr>(this: UpdateQuery<TUpdatedColumns, TReturningColumns, TFromTblCols, NoColumnsSelected> | void, expr1: T1): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1>>, TFromTblCols, NamedExpressionNameOf<T1>>;

	/** Selects 1 named expressions. */
	public returning<T1 extends NmdExpr>(expr1: T1): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 2 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 3 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 4 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 5 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 6 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 7 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6> & NmdExprToImplctColumn<T7>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 8 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr, T8 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7, expr8: T8): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6> & NmdExprToImplctColumn<T7> & NmdExprToImplctColumn<T8>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single column that is currently in scope. */
	public returning<TColumnName extends keyof TFromTblCols>(this: UpdateQuery<TUpdatedColumns, TReturningColumns, TFromTblCols, NoColumnsSelected>, column1: TColumnName): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & {[TName in TColumnName]: TFromTblCols[TName]}>, TFromTblCols, TColumnName>;

	/** Selects columns that are currently in scope. */
	public returning<TColumnNames extends keyof TFromTblCols>(...columns: TColumnNames[]): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & {[TName in TColumnNames]: TFromTblCols[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	public returning(...args: ((keyof TFromTblCols) | NmdExpr | AllExpression<any>)[]): any {
		handleSelect(this.lastFromItem, this.columns as any, this.selectedColumns, args);
		return this;
	}
}
