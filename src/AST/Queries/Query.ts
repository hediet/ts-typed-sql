import { FromItem, QueryFromItem, FromItemCtor, ImplicitColumnsToColumns } from "../FromFactor";
import { NamedExpression, ColumnBoundToExpression, NamedExpressionNameOf, ExpressionTypeOf, AllExpression, AsColumn } from "../Expressions";
import { ColumnDescription } from "../ColumnDescription";
import { ColumnsWithTypesToImplicit } from "../Table";

export type ImplicitColumnsToNmdExprs<TColumns> =
	{ [TName in keyof TColumns]: NamedExpression<TName, TColumns[TName]> };

export class Query<TReturningColumns> {
	protected columns: ImplicitColumnsToNmdExprs<TReturningColumns> = {} as any;
	protected selectedColumns: (NamedExpression<any, any>|AllExpression<any>)[] = [];

	private _isWithRecursive: boolean = false;
	private _withItems: FromItem<any>[] = [];
	
	public getState() {
		return {
			isWithRecursive: this._isWithRecursive,
			withItems: this._withItems,
			selected: this.selectedColumns
		}
	}

	public withRecursive(view: FromItem<any>): this {
		this._isWithRecursive = true;
		return this.with(view);
	}

	public with(view: FromItem<any>): this {
		this._withItems.push(view);
		return this;
	}

	public as(name: string): FromItemCtor<TReturningColumns>;
	public as<TColumnsWithTypes extends { [columnName: string]: ColumnDescription<any>}>(name: string, columns: TColumnsWithTypes): FromItemCtor<ColumnsWithTypesToImplicit<TColumnsWithTypes>>;
	public as(name: string, columns?: { [columnName: string]: ColumnDescription<any>}): FromItemCtor<TReturningColumns> {
		const newColumns = {} as any;
		const setters: ((fromItem: FromItem<any>) => void)[] = [];

		let castToColumns: boolean;

		if (!columns) {
			castToColumns = false;
			for (const nmdExpr of Object.values(this.columns) as NamedExpression<any, any>[]) {
				newColumns[nmdExpr.name] = new ColumnBoundToExpression(nmdExpr, setter => setters.push(setter));
			}
		}
		else {
			castToColumns = true;
			for (const name of Object.keys(columns)) {
				newColumns[name] = new AsColumn(name, setter => setters.push(setter));
			}
		}

		const fromItem = new QueryFromItem(name, newColumns, this, castToColumns);
		for (const setter of setters) setter(fromItem);

		return fromItem as any; // fields are set in constructor
	}
}