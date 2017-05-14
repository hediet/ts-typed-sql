import {
	FromItem, Row, FromFactor,
	FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin, FromFactorCrossJoin, getColumn, HardRow
} from "../FromFactor";
import { Table } from "../Table";
import { Expression, ExpressionOrInputValue, AllExpression, toCondition, and, normalize, NamedExpression, NamedExpressionNameOf, Column } from "../Expressions";
import { Query, SingleColumn, MoreThanOneColumnSelected, NoColumnsSelected } from './Query';
import { NmdExpr, Simplify, NmdExprToRow, resolveColumnReference, handleSelect, Constructable } from "./Common";
import { JoinMixin, JoinMixinInstance } from "./JoinMixin";
import { WhereMixin, WhereMixinInstance } from "./WhereMixin";
import { BooleanType, AnyType } from "../Types";
import { objectEntries } from "../../Helpers";

export function update<T extends Row>(table: FromItem<T> & Table<any, any>): UpdateQuery<T, {}, T, NoColumnsSelected> {
	return new UpdateQuery<T, {}, T, NoColumnsSelected>(table);
}
export class UpdateQuery<TUpdatedColumns extends Row, TReturningColumns extends Row, TFromTblCols extends Row, TSingleColumn extends SingleColumn<TReturningColumns>>
	extends JoinMixin(WhereMixin<Constructable<Query<TReturningColumns, TSingleColumn>>, TFromTblCols>(Query)) {

	protected _from: FromFactor | undefined = undefined;
	protected _whereCondition: Expression<BooleanType> | undefined;
	protected lastFromItem: FromItem<TFromTblCols> | undefined;

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

	/**
	 * Selects from a table. If previous tables are already specified, they are cross joined.
	 * These tables can be used to for condition or value expressions.
	 * @param table The table to select from.
	 */
	public from<TTableColumns extends HardRow>(table: FromItem<TTableColumns>): UpdateQuery<TUpdatedColumns, TReturningColumns, TTableColumns, TSingleColumn> {
		this._from = FromFactor.crossJoin(this._from, table);
		this.lastFromItem = table as any;
		return this as any;
	}

	/**
	 * Sets a new value for a column.
	 * Use `defaultValue()` to reset a column to its default value.
	 * 
	 * @param column The column to update.
	 * @param value The new value for the column.
	 */
	public set<TColumn extends keyof TUpdatedColumns>(column: TColumn, value: ExpressionOrInputValue<TUpdatedColumns[TColumn]>): this;
	/**
	 * Sets new values for specified columns.
	 * @param obj The columns to update and their new values.
	 */
	public set(obj: {[TColumnName in keyof TUpdatedColumns]?: ExpressionOrInputValue<TUpdatedColumns[TColumnName]>}): this;
	public set(columnOrObject: string | object, value?: ExpressionOrInputValue<any>): this {
		if (typeof columnOrObject === "string") {
			const column = getColumn(this._table, columnOrObject);
			const expr = normalize(column.type, value);
			this._updatedColumns[columnOrObject] = expr;
		}
		else {
			for (const [name, value] of objectEntries(columnOrObject)) {
				const column = getColumn(this._table, name);
				const expr = normalize(column.type, value);
				this._updatedColumns[name as string] = expr;
			}
		}

		return this;
	}

	/** Selects all columns from the given table. */
	public returning<T extends Row>(table: AllExpression<T>): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & {[TName in keyof T]: T[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single named expression. */
	public returning<T1 extends NmdExpr>(this: UpdateQuery<TUpdatedColumns, TReturningColumns, TFromTblCols, NoColumnsSelected> | void, expr1: T1): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1>>, TFromTblCols, NamedExpressionNameOf<T1>>;

	/** Selects 1 named expressions. */
	public returning<T1 extends NmdExpr>(expr1: T1): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 2 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 3 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 4 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 5 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 6 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 7 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 8 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr, T8 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7, expr8: T8): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7> & NmdExprToRow<T8>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single column that is currently in scope. */
	public returning<TColumnName extends keyof TFromTblCols>(this: UpdateQuery<TUpdatedColumns, TReturningColumns, TFromTblCols, NoColumnsSelected>, column1: TColumnName): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & {[TName in TColumnName]: TFromTblCols[TName]}>, TFromTblCols, TColumnName>;

	/** Selects columns that are currently in scope. */
	public returning<TColumnNames extends keyof TFromTblCols>(...columns: TColumnNames[]): UpdateQuery<TUpdatedColumns, Simplify<TReturningColumns & {[TName in TColumnNames]: TFromTblCols[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	public returning(...args: ((keyof TFromTblCols) | NmdExpr | AllExpression<object>)[]): any {
		handleSelect(this.lastFromItem, args, this.returningColumns as any, this.selectedExpressions);
		return this;
	}
}
