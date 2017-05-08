import { Expression, Column, ColumnBoundToExpression, AllExpression, ExpressionTypeOf, FromItemExpression } from "./Expressions";
import { toObject, objectEntries, objectValues } from "../Helpers";
import { Query } from "./Queries/Query";
import { AnyType, Record, BooleanType } from "./Types";

export interface Row {
	[name: string]: any;//AnyType;
}

export interface Columns {
	[name: string]: any;//Column<string, AnyType>;
}

export type RowToColumns<TColumns extends Row> =
	{[TName in keyof TColumns]: Column<TName, TColumns[TName]> };

export type ColumnsToRow<TColumns extends Columns>
	= {[TName in keyof TColumns]: ExpressionTypeOf<TColumns[TName]> };

export class FromFactor {
	_brand: "FromFactor";

	public static getAllFromFactors(factor: FromFactor): FromItem<any>[] {
		if (factor instanceof FromItem) return [factor];
		else if (factor instanceof FromFactorAbstractJoin) {
			return FromFactor.getAllFromFactors(factor.leftArg).concat(
				FromFactor.getAllFromFactors(factor.rightArg)
			);
		}

		throw new Error("Unsupported from factor");
	}

	public static crossJoin(factor1: FromFactor | undefined, factor2: FromFactor | undefined): FromFactor | undefined {
		if (!factor1) return factor2;
		if (!factor2) return factor1;
		return new FromFactorCrossJoin(factor1, factor2);
	}
}

export abstract class FromFactorAbstractJoin extends FromFactor {
	constructor(public readonly leftArg: FromFactor,
		public readonly rightArg: FromFactor) {

		super();
	}
}

export abstract class FromFactorAbstractConditionalJoin extends FromFactorAbstractJoin {
	constructor(leftArg: FromFactor, rightArg: FromFactor,
		public readonly joinCondition: Expression<BooleanType>) {

		super(leftArg, rightArg);
	}

	public abstract getType(): string;
}

export class FromFactorLeftJoin extends FromFactorAbstractConditionalJoin { public getType() { return "left"; } };
export class FromFactorFullJoin extends FromFactorAbstractConditionalJoin { public getType() { return "full"; } };
export class FromFactorInnerJoin extends FromFactorAbstractConditionalJoin { public getType() { return "inner"; } };
export class FromFactorCrossJoin extends FromFactorAbstractJoin { public getType() { return "cross"; } };

export type FromItemToRow<TFromItem extends FromItem<any>> =
	{[TName in keyof TFromItem["$columns"]]: ExpressionTypeOf<TFromItem["$columns"][TName]> };

export abstract class FromItem<TColumns extends Row> extends FromFactor {
	public readonly $columns: RowToColumns<TColumns>;
	public readonly $all: AllExpression<TColumns> = new AllExpression(this);

	constructor(columns: RowToColumns<TColumns>, private readonly castToColumns: boolean) {
		super();
		this.$columns = columns;

		for (const [name, col] of objectEntries(columns)) {
			if (!(name in this))
				(this as any)[name] = col;
		}
	}

	public as(name: string): FromItemCtor<TColumns> {
		const setters: ((fromItem: FromItem<any>) => void)[] = [];
		const columns = objectValues(this.$columns)
			.map((col: Column<any, any>) => new ColumnBoundToExpression(col, s => setters.push(s)));
		const result = new NamedFromItem<TColumns>(name, toObject(columns, c => c.name), this, false) as any;
		for (const s of setters) s(result);
		return result;
	}

	public asNullable(): FromItemCtor<{[TKey in keyof TColumns]: TColumns[TKey] | null }> {
		return this as any;
	}

	public asExpression(): Expression<Record<TColumns>> {
		return new FromItemExpression<TColumns>(this);
	}
}

export function isCastToColumns(fromItem: FromItem<any>): boolean {
	return fromItem["castToColumns"];
}

export function getColumn(fromItem: FromItem<any>, column: string): Column<string, AnyType> {
	const result = fromItem.$columns[column];
	if (!result) throw new Error(`Column '${column}' does not exist on table '${fromItem}'.`);
	return result;
}

export class NamedFromItem<TColumns extends Row> extends FromItem<TColumns> {
	constructor(public readonly $name: string, columns: RowToColumns<TColumns>, public readonly fromItem: FromItem<TColumns>, castToColumns: boolean) {
		super(columns, castToColumns);
	}
}

export class QueryFromItem<TColumns> extends FromItem<TColumns> {
	constructor(public readonly $name: string, columns: RowToColumns<TColumns>, public readonly query: Query<TColumns, any>, castToColumns: boolean) {
		super(columns, castToColumns);
	}
}

export type FromItemCtor<TColumns extends Row> = FromItem<TColumns> & RowToColumns<TColumns>;


/* TODO, for recursion
export class BindableFromItem<TColumns extends ImplicitColumns> extends FromItem<TColumns> {
	public bind(fromItem: FromItem<TColumns>): void;
	public bindAndOverrideColumnNames(view: FromItem<any>): void;
}

type BindableViewCtor<TColumns extends ImplicitColumns> = BindableFromItem<TColumns> & ImplicitColumnsToColumns<TColumns>;

export function view<TColumnsWithTypes extends { [columnName: string]: Columns.ColumnDescription<any> }>(
		tableName: string, columns: TColumnsWithTypes):
	BindableViewCtor<ColumnsWithTypesToImplicit<TColumnsWithTypes>> {
	
	return null!;
}
*/