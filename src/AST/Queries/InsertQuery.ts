import { MapExpressionOrInputValue, AllExpression, NamedExpression, NamedExpressionNameOf, Expression } from '../Expressions';
import { RetrievalQuery } from './RetrievalQuery';
import { Table, TableRequiredColumns, TableOptionalColumns } from "../Table";
import { Row, FromItem } from "../FromFactor";
import { Query, MoreThanOneColumnSelected, NoColumnsSelected, SingleColumn } from "./Query";
import { Simplify, NmdExprToRow, NmdExpr, handleSelect, ErrorMessage } from "./Common";
import { combine } from "../../Helpers";

/**
 * Creates an INSERT INTO statement.
 * 
 * @param table The table to insert into.
 */
export function insertInto<TTable extends Table<any, any>>(table: TTable):
	InsertQueryBuilder<TableRequiredColumns<TTable>, TableOptionalColumns<TTable>> {

	return new InsertQueryBuilder<TableRequiredColumns<TTable>, TableOptionalColumns<TTable>>(table);
}

export type InsertRows<TRequiredColumns, TOptionalColumns> = (MapExpressionOrInputValue<TRequiredColumns> & Partial<MapExpressionOrInputValue<TOptionalColumns>>)[];
export type InsertRowQuery<TRequiredColumns, TOptionalColumns> = RetrievalQuery<TRequiredColumns & Partial<TOptionalColumns>, any>;

/**
 * Represents an INSERT INTO statement that needs values.
 */
export class InsertQueryBuilder<TRequiredColumns extends Row, TOptionalColumns extends Row> {
	constructor(private readonly table: Table<TRequiredColumns, TOptionalColumns>) { }

	/**
	 * Inserts one or more items.
	 * @param items The items to be inserted.
	 */
	public value(...items: InsertRows<TRequiredColumns, TOptionalColumns>) {
		return this.values(items);
	}

	/**
	 * Inserts an array of items.
	 * @param items The items to be inserted.
	 */
	public values(items: InsertRows<TRequiredColumns, TOptionalColumns>): InsertQuery<TRequiredColumns & TOptionalColumns, {}, NoColumnsSelected> {
		return new InsertQuery<TRequiredColumns & TOptionalColumns, {}, NoColumnsSelected>(this.table, items);
	}

	/**
	 * Uses a subquery to retrieve the items to be inserted.
	 * @param query A query that returns the items to be inserted.
	 */
	public valuesFrom(query: InsertRowQuery<TRequiredColumns, TOptionalColumns>): InsertQuery<TRequiredColumns & TOptionalColumns, {}, NoColumnsSelected> {
		return new InsertQuery<TRequiredColumns & TOptionalColumns, {}, NoColumnsSelected>(this.table, query);
	}
}

/**
 * Represents an INSERT INTO statement.
 */
export class InsertQuery<TTableColumns extends Row, TReturningColumns extends Row, TSingleColumn extends SingleColumn<TTableColumns>>
	extends Query<TReturningColumns, TSingleColumn> {

	constructor(private readonly table: Table<any, any>, private readonly values: InsertRows<any, any> | InsertRowQuery<any, any>) {
		super();
	}

	public getState() {
		return combine(super.getState(), {
			table: this.table,
			values: this.values
		});
	}

	/** Selects all columns from the given table. */
	public returning<T extends Row>(table: AllExpression<T>): InsertQuery<TTableColumns, Simplify<TReturningColumns & {[TName in keyof T]: T[TName]}>, MoreThanOneColumnSelected>;

	/** Selects a single named expression. */
	public returning<T1 extends NmdExpr>(this: InsertQuery<TTableColumns, TReturningColumns, NoColumnsSelected> | void, expr1: T1): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1>>, NamedExpressionNameOf<T1>>;

	/** Selects 1 named expressions. */
	public returning<T1 extends NmdExpr>(expr1: T1): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1>>, MoreThanOneColumnSelected>;

	/** Selects 2 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2>>, MoreThanOneColumnSelected>;

	/** Selects 3 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3>>, MoreThanOneColumnSelected>;

	/** Selects 4 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4>>, MoreThanOneColumnSelected>;

	/** Selects 5 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5>>, MoreThanOneColumnSelected>;

	/** Selects 6 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6>>, MoreThanOneColumnSelected>;

	/** Selects 7 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7>>, MoreThanOneColumnSelected>;

	/** Selects 8 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr, T8 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7, expr8: T8): InsertQuery<TTableColumns, Simplify<TReturningColumns & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7> & NmdExprToRow<T8>>, MoreThanOneColumnSelected>;

	/** Selects a single column that is currently in scope. */
	public returning<TColumnName extends keyof TTableColumns>(this: InsertQuery<TTableColumns, TReturningColumns, NoColumnsSelected>, column1: TColumnName): InsertQuery<TTableColumns, Simplify<TReturningColumns & {[TName in TColumnName]: TTableColumns[TName]}>, TColumnName>;

	/** Selects columns that are currently in scope. */
	public returning<TColumnNames extends keyof TTableColumns>(...columns: TColumnNames[]): InsertQuery<TTableColumns, Simplify<TReturningColumns & {[TName in TColumnNames]: TTableColumns[TName]}>, MoreThanOneColumnSelected>;

	public returning(this: ErrorMessage<"Expressions must have names. Use expr.as('name').">, ...expr: Expression<any>[]): "Error";

	public returning(...args: ((keyof TTableColumns) | NmdExpr | AllExpression<any> | Expression<any>)[]): any {
		handleSelect(this.table, args as any, this.returningColumns as any, this.selectedExpressions);
		return this;
	}
}
