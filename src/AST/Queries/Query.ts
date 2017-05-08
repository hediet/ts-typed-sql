import { AnyType } from '../Types';
import { FromItem, QueryFromItem, FromItemCtor, RowToColumns, Row } from "../FromFactor";
import { NamedExpression, ColumnBoundToExpression, NamedExpressionNameOf, ExpressionTypeOf, AllExpression, AsColumn } from "../Expressions";
import { RowDescriptionToRow } from "../Table";
import { objectValues, objectEntries } from "../../Helpers";

export type RowToNmdExprs<TRow extends Row> =
	{ [TName in keyof TRow]: NamedExpression<TName, TRow[TName]> };

export interface NoColumnsSelected { _brand: "NoColumnSelected" }
export interface MoreThanOneColumnSelected { _brand: "MoreThanOneColumnSelected" }
export type SingleColumn<TSelectedCols> = NoColumnsSelected|(keyof TSelectedCols)|MoreThanOneColumnSelected;

export class Query<TReturningRow extends Row, TSingleColumn extends SingleColumn<TReturningRow>> {
	protected returningColumns: RowToNmdExprs<TReturningRow> = {} as any;
	protected selectedExpressions: (NamedExpression<any, any>|AllExpression<any>)[] = [];

	/**
	 * Returns `NoColumnsSelected` if no columns are selected,
	 * `MoreThanOneColumnSelected` if more than one columns are selected or 
	 * the name of the column if exactly one column is selected.
	 */
	public get singleColumn(): TSingleColumn {
		const first = this.selectedExpressions[0];
		if (this.selectedExpressions.length === 1 && !(first instanceof AllExpression))
			return first.name;
		return undefined as any;
	}

	private _isWithRecursive: boolean = false;
	private _withItems: FromItem<any>[] = [];
	
	public getState() {
		return {
			isWithRecursive: this._isWithRecursive,
			withItems: this._withItems,
			selected: this.selectedExpressions,
			returningColumns: this.returningColumns
		}
	}

/* Not supported yet.
	public withRecursive(view: FromItem<any>): this {
		this._isWithRecursive = true;
		return this.with(view);
	}

	public with(view: FromItem<any>): this {
		this._withItems.push(view);
		return this;
	}
	*/

	/**
	 * Names this query and returns it as `FromItem`.
	 * @param name The name of the query that will be used in the SQL statement.
	 */
	public as(name: string): FromItemCtor<TReturningRow>;

	/**
	 * Names this query and renames its columns and returns it as `FromItem`.
	 * @param name The name of the query that will be used in the SQL statement.
	 * @param columns The columns to cast to.
	 */
	public as<TColumnsWithTypes extends { [columnName: string]: AnyType }>(name: string, columns: TColumnsWithTypes): FromItemCtor<RowDescriptionToRow<TColumnsWithTypes>>;
	public as(name: string, columns?: { [columnName: string]: AnyType }): FromItemCtor<TReturningRow> {
		const newColumns = {} as any;
		const setters: ((fromItem: FromItem<any>) => void)[] = [];

		let castToColumns: boolean;

		if (!columns) {
			castToColumns = false;
			for (const nmdExpr of objectValues(this.returningColumns) as NamedExpression<any, any>[]) {
				newColumns[nmdExpr.name] = new ColumnBoundToExpression(nmdExpr, setter => setters.push(setter));
			}
		}
		else {
			castToColumns = true;
			for (const [name, type] of objectEntries(columns)) {
				newColumns[name] = new AsColumn(name, type, setter => setters.push(setter));
			}
		}

		const fromItem = new QueryFromItem(name, newColumns, this, castToColumns);
		for (const setter of setters) setter(fromItem);

		return fromItem as any; // fields are set in constructor
	}
}