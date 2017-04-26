import { MapExpressionOrValue, AllExpression } from '../Expressions';
import { RetrievalQuery } from './RetrievalQuery';
import { Table, TableRequiredColumns, TableOptionalColumns } from "../Table";
import { ImplicitColumns } from "../FromFactor";
import { Query } from "./Query";
import { Simplify, NmdExprToImplctColumn, NmdExpr, handleSelect } from "./Common";

export function insertInto<TTable extends Table<any, any>>(table: TTable):
		InsertQueryBuilder<TableRequiredColumns<TTable>, TableOptionalColumns<TTable>> {

	return new InsertQueryBuilder<TableRequiredColumns<TTable>, TableOptionalColumns<TTable>>(table);
}

type Rows<TRequiredColumns, TOptionalColumns> = (MapExpressionOrValue<TRequiredColumns> & Partial<MapExpressionOrValue<TOptionalColumns>>)[];
type RowQuery<TRequiredColumns, TOptionalColumns> = RetrievalQuery<TRequiredColumns & Partial<TOptionalColumns>, any>;

export class InsertQueryBuilder<TRequiredColumns, TOptionalColumns> {
	constructor(private readonly table: Table<TRequiredColumns, TOptionalColumns>) {}

	public values(...items: Rows<TRequiredColumns, TOptionalColumns>): InsertQuery<TRequiredColumns & TOptionalColumns, {}> {
		return new InsertQuery(this.table, items);
	}

	public valuesFrom(query: RowQuery<TRequiredColumns, TOptionalColumns>): InsertQuery<TRequiredColumns & TOptionalColumns, {}> {
		return new InsertQuery(this.table, query);
	}
}

export class InsertQuery<TColumns, TReturningColumns extends ImplicitColumns>
	extends Query<TReturningColumns> {

	constructor(private readonly table: Table<any, any>, private readonly values: Rows<any, any>|RowQuery<any, any>) {
		super();
	}

	public getState() {
		return Object.assign({
			table: this.table,
			values: this.values
		}, super.getState());
	}

	/**
	 * Selects all columns from the given table.
	 */
	public returning<T extends ImplicitColumns>(table: AllExpression<T>)
		: InsertQuery<TColumns, Simplify<TReturningColumns & {[TName in keyof T]: T[TName]}>>;

	public returning<T1 extends NmdExpr>(expr1: T1)
		: InsertQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1>>>;
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2)
		: InsertQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2>>>;
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3)
		: InsertQuery<TColumns, Simplify<TReturningColumns & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3>>>;

	/**
	 * Selects given columns from the current table.
	 */
	public returning<TColumnNames extends keyof TColumns>(...columns: TColumnNames[])
		: InsertQuery<TColumns, Simplify<TReturningColumns & {[TName in TColumnNames]: TColumns[TColumnNames]}>>;
	public returning(...args: ((keyof TColumns) | NmdExpr | AllExpression<any>)[]): any {
		handleSelect(this.table, this.columns as any, this.selectedColumns, ...args);
		return this;
	}
}
