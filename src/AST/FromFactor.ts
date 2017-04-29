import { Expression, Column, ColumnBoundToExpression, AllExpression, ExpressionTypeOf } from "./Expressions";
import { toObject } from "../Helpers";
import { Query } from "../AST/Queries/Query";

export interface ImplicitColumns {
	[name: string]: any;
}

export type ImplicitColumnsToColumns<TColumns extends ImplicitColumns> =
	{ [TName in keyof TColumns]: Column<TName, TColumns[TName]> };

export type ColumnsToImplicit<TColumns extends ImplicitColumns>
	= { [TName in keyof TColumns]: ExpressionTypeOf<TColumns[TName]> };

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

	public static crossJoin(factor1: FromFactor|undefined, factor2: FromFactor|undefined): FromFactor|undefined {
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
			public readonly joinCondition: Expression<boolean>) {
		super(leftArg, rightArg);
	}

	public abstract getType(): string;
}

export class FromFactorLeftJoin extends FromFactorAbstractConditionalJoin { public getType() { return "left"; } };
export class FromFactorFullJoin extends FromFactorAbstractConditionalJoin { public getType() { return "full"; } };
export class FromFactorInnerJoin extends FromFactorAbstractConditionalJoin { public getType() { return "inner"; } };
export class FromFactorCrossJoin extends FromFactorAbstractJoin { public getType() { return "cross"; } };

export type FromItemToImplicitColumns<TFromItem extends FromItem<any>> =
	{ [TName in keyof TFromItem["$columns"] ]: ExpressionTypeOf<TFromItem["$columns"][TName]> } ;

export abstract class FromItem<TColumns extends ImplicitColumns> extends FromFactor {
	public readonly $columns: ImplicitColumnsToColumns<TColumns>;
	public readonly $all: AllExpression<TColumns> = new AllExpression(this);

	constructor(columns: ImplicitColumnsToColumns<TColumns>, private readonly castToColumns: boolean) {
		super();
		this.$columns = columns;

		for (const [name, col] of Object.entries(columns)) {
			if (!(name in this))
				(this as any)[name] = col;
		}
	}

	public as(name: string): FromItemCtor<TColumns> {
		const setters: ((fromItem: FromItem<any>) => void)[] = [];
		const columns = Object.values(this.$columns)
			.map((col: Column<any, any>) => new ColumnBoundToExpression(col, s => setters.push(s)));
		const result = new NamedFromItem<TColumns>(name, toObject(columns, c => c.name), this, false) as any;
		for (const s of setters) s(result);
		return result;
	}

	public asNullable(): FromItemCtor<{ [TKey in keyof TColumns]: TColumns[TKey]|null }> {
		return this as any;
	}

	/* todo
	public asExpression(): Expression<Record<TColumns>> {
		
	}
	*/
}

export interface Record<T> {
	__t: T;
	textRepresentation: string;
}

export function isCastToColumns(fromItem: FromItem<any>): boolean {
	return fromItem["castToColumns"];
}

export function getColumn(fromItem: FromItem<any>, column: string): Expression<any> {
	const result = fromItem.$columns[column];
	if (!result) throw new Error(`Column '${column}' does not exist on table '${fromItem}'.`);
	return result;
}

export class NamedFromItem<TColumns extends ImplicitColumns> extends FromItem<TColumns> {
	constructor(public readonly $name: string, columns: ImplicitColumnsToColumns<TColumns>, public readonly fromItem: FromItem<TColumns>, castToColumns: boolean) {
		super(columns, castToColumns);
	}
}

export class QueryFromItem<TColumns> extends FromItem<TColumns> {
	constructor(public readonly $name: string, columns: ImplicitColumnsToColumns<TColumns>, public readonly query: Query<TColumns, any>, castToColumns: boolean) {
		super(columns, castToColumns);
	}
}

export type FromItemCtor<TColumns extends ImplicitColumns> = FromItem<TColumns> & ImplicitColumnsToColumns<TColumns>;


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