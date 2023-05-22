import {
	FromItem, Row, FromFactor,
	FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin, FromFactorCrossJoin, getColumn, HardRow
} from "../FromFactor";
import { Table } from "../Table";
import { Expression, ExpressionOrInputValue, AllExpression, toCondition, and, normalize, NamedExpression, NamedExpressionNameOf, Column, MapExpressionOrInputValue } from "../Expressions";
import { Query, SingleColumn, MoreThanOneColumnSelected, NoColumnsSelected } from './Query';
import { NmdExpr, Simplify, NmdExprToRow, resolveColumnReference, handleSelect, Constructable, ErrorMessage } from "./Common";
import { doJoin, JoinConditionBuilder } from "./JoinMixin";
import { BooleanType, AnyType } from "../Types";
import { objectEntries } from "../../Helpers";

export function update<T extends Row>(table: FromItem<T> & Table<any, any>): UpdateQuery<T, {}, T, NoColumnsSelected> {
	return new UpdateQuery<T, {}, T, NoColumnsSelected>(table);
}

export class UpdateQuery<TColumnsToUpdate extends Row, TReturningColumns extends Row, TFromTblCols extends Row, TSingleColumn extends SingleColumn<TReturningColumns>>
	extends Query<TReturningColumns, TSingleColumn> {

	private readonly _table: FromItem<TColumnsToUpdate> & Table<any, any>;

	private _updatedColumns: {[TColumnName in keyof TFromTblCols]?: Expression<TFromTblCols[TColumnName]>} = {};

	constructor(table: FromItem<TColumnsToUpdate & TFromTblCols> & Table<any, any>) {
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
	public from<TTableColumns extends HardRow>(table: FromItem<TTableColumns>): UpdateQuery<TColumnsToUpdate, TReturningColumns, TTableColumns, TSingleColumn> {
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
	public set<TColumn extends keyof TColumnsToUpdate>(column: TColumn, value: ExpressionOrInputValue<TColumnsToUpdate[TColumn]>): this;
	/**
	 * Sets new values for specified columns.
	 * @param obj The columns to update and their new values.
	 */
	public set(obj: {[TColumnName in keyof TColumnsToUpdate]?: ExpressionOrInputValue<TColumnsToUpdate[TColumnName]>}): this;
	public set(columnOrObject: string | object, value?: ExpressionOrInputValue<any>): this {
		if (typeof columnOrObject === "string") {
			const column = getColumn(this._table, columnOrObject);
			const expr = normalize(column.type, value);
			this._updatedColumns[columnOrObject as keyof TFromTblCols] = expr as any;
		}
		else {
			for (const [name, value] of objectEntries(columnOrObject)) {
				const column = getColumn(this._table, name);
				const expr = normalize(column.type, value);
				this._updatedColumns[name as keyof TFromTblCols] = expr as any;
			}
		}

		return this;
	}

	/** Selects all columns from the given table. */
	public returning<T extends Row>(table: AllExpression<T>): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & {[TName in keyof T]: T[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single named expression. */
	public returning<T1 extends NmdExpr>(this: UpdateQuery<TColumnsToUpdate, TReturningColumns, TFromTblCols, NoColumnsSelected> | void, expr1: T1): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1>>, TFromTblCols, NamedExpressionNameOf<T1>>;

	/** Selects 1 named expressions. */
	public returning<T1 extends NmdExpr>(expr1: T1): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 2 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 3 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 4 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 5 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 6 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 7 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 8 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr, T8 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7, expr8: T8): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7> & NmdExprToRow<T8>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single column that is currently in scope. */
	public returning<TColumnName extends keyof TFromTblCols>(this: UpdateQuery<TColumnsToUpdate, TReturningColumns, TFromTblCols, NoColumnsSelected>, column1: TColumnName): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & {[TName in TColumnName]: TFromTblCols[TName]}>, TFromTblCols, TColumnName>;

	/** Selects columns that are currently in scope. */
	public returning<TColumnNames extends keyof TFromTblCols>(...columns: TColumnNames[]): UpdateQuery<TColumnsToUpdate, Simplify<TReturningColumns & {[TName in TColumnNames]: TFromTblCols[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	public returning(this: ErrorMessage<"Expressions must have names. Use expr.as('name').">, ...expr: Expression<any>[]): "Error";

	public returning(...args: ((keyof TFromTblCols) | NmdExpr | AllExpression<object> | Expression<any>)[]): any {
		handleSelect(this.lastFromItem, args as any, this.returningColumns as any, this.selectedExpressions);
		return this;
	}

	// #region call-macro whereMixin("TFromTblCols")
	protected _whereCondition: Expression<BooleanType> | undefined;
	protected lastFromItem: FromItem<TFromTblCols> | undefined;

	/**
	* Adds where conditions.
	* @param obj The object that defines equals expressions.
	*/
	public where(obj: Partial<MapExpressionOrInputValue<TFromTblCols>>): this;
	/**
	* Adds where conditions.
	* @param conditions The condition expressions.
	*/
	public where(...conditions: Expression<BooleanType>[]): this;
	public where(...args: any[]): this {
		const expression = toCondition(this.lastFromItem, args);
		this._whereCondition = and(this._whereCondition, expression);
		return this;
	}

	/**
	* Adds negated where conditions.
	*/
	public whereNot(condition: Expression<BooleanType>, ...conditions: Expression<BooleanType>[]): this {
		this._whereCondition = and(this._whereCondition, condition.not(), ...conditions.map(c => c.not()));
		return this;
	}
	// #endregion

	// #region call-macro joinMixin()
	protected _from: FromFactor | undefined = undefined;

	/**
	* Performs a full join on the current query (`cur`) and a specified table (`joined`).
	* These rows are returned:
	* ```
	* for (row r in cur): for (row j in joined that matches r)
	* 	yield row(r, j)
	* for (row r in cur): if (joined has no row that matches r)
	* 	yield row(r, null)
	* for (row j in joined): if (cur has no row that matches j)
	* 	yield row(null, j)
	* ```
	*/
	public fullJoin<TFromItemColumns extends HardRow>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
		return doJoin(this, this._from, newFrom => this._from = newFrom, FromFactorFullJoin, fromItem);
	}

	/**
	* Performs a left join on the current query (`cur`) and a specified table (`joined`).
	* These rows are returned:
	* ```
	* for (row r in cur): for (row j in joined that matches r)
	* 	yield row(r, j)
	* for (row r in cur): if (joined has no row that matches r)
	* 	yield row(r, null)
	* ```
	*/
	public leftJoin<TFromItemColumns extends HardRow>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
		return doJoin(this, this._from, newFrom => this._from = newFrom, FromFactorLeftJoin, fromItem);
	}

	/**
	* Performs an inner join on the current query (`cur`) and a specified table (`joined`).
	* These rows are returned:
	* ```
	* for (row r in cur): for (row j in joined that matches r)
	* 	yield row(r, j)
	* ```
	*/
	public innerJoin<TFromItemColumns extends HardRow>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
		return doJoin(this, this._from, newFrom => this._from = newFrom, FromFactorInnerJoin, fromItem);
	}
// #endregion
}
