import { Ordering } from "./Ordering";
import { FromItem, Row, getColumn } from "./FromFactor";
import { RetrievalQuery } from "./Queries/RetrievalQuery";
import { Table } from "./Table";
import {
	AnyType,
	BooleanType,
	GetInType,
	IntegerType,
	Json,
	Record,
	RecordTypeToJson,
	tBoolean,
	TextType,
	tInteger,
	tJson,
	tText,
	tVoid,
	VoidType,
	Type,
	tRecord
} from './Types';

export type ExpressionTypeOf<T extends Expression<any>> = T["type"];

export abstract class Expression<T extends AnyType> {
	public readonly type: T;

	constructor(type: T) {
		if (!type || !type.serialize) throw new Error(`No type given: ${type}.`);
		this.type = type;
	}

	public get precedenceLevel(): number { return 0; }

	public cast<T2 extends AnyType>(type: T2): Expression<T2> { return new CastExpression(this, type); }
	public narrow<T2 extends T>(): Expression<T2> { return this as any; }

	public as<TName extends string>(name: TName): NamedExpression<TName, T> {
		return new NamedExpressionWrapper<TName, T>(name, this); }

	public isEqualTo(other: ExpressionOrInputValue<T>): Expression<BooleanType> {
		return new EqualsExpression(this, normalize(this.type, other)); }
	public isNotEqualTo(other: ExpressionOrInputValue<T>): Expression<BooleanType> {
		return new UnequalsExpression(this, normalize(this.type, other)); }

	public isLessThan(other: ExpressionOrInputValue<T>): Expression<BooleanType> {
		return new LessExpression(this, normalize(this.type, other)); }
	public isAtMost(other: ExpressionOrInputValue<T>): Expression<BooleanType> {
		return new LessOrEqualExpression(this, normalize(this.type, other)); }
	public isGreaterThan(other: ExpressionOrInputValue<T>): Expression<BooleanType> {
		return new GreaterExpression(this, normalize(this.type, other)); }
	public isAtLeast(other: ExpressionOrInputValue<T>): Expression<BooleanType> {
		return new GreaterOrEqualExpression(this, normalize(this.type, other)); }

	public isNull(): Expression<BooleanType> { return new IsNullExpression(this); }
	public isNotNull(): Expression<BooleanType> { return new IsNotNullExpression(this); }

	public and(this: Expression<BooleanType>, other: Expression<BooleanType>): Expression<BooleanType> {
		return new AndExpression(this, other); }
	public or(this: Expression<BooleanType>, other: Expression<BooleanType>): Expression<BooleanType> {
		return new OrExpression(this, other); }

	public not(this: Expression<BooleanType>): Expression<BooleanType> { return new NotExpression(this); }

	public isIn(values: ExpressionOrInputValue<T>[]): Expression<BooleanType> { return new IsInValuesExpression(this, values.map(v => normalize(this.type, v))); }
	public isInQuery<TRow extends { [name: string]: AnyType }, TSingleColumn extends keyof TRow>(this: Expression<TRow[TSingleColumn]>,
		values: RetrievalQuery<TRow, TSingleColumn>): Expression<BooleanType> { return new IsInQueryExpression(this, values); }
	
	public minus(this: Expression<IntegerType>, other: ExpressionOrInputValue<IntegerType>): Expression<IntegerType> {
		return new SubtractionExpression(this, normalize(tInteger, other)); }
	public plus(this: Expression<IntegerType>, other: ExpressionOrInputValue<IntegerType>): Expression<IntegerType> {
		return new AdditionExpression(this, normalize(tInteger, other)); }
	public mult(this: Expression<IntegerType>, other: ExpressionOrInputValue<IntegerType>): Expression<IntegerType> {
		return new MultiplicationExpression(this, normalize(tInteger, other)); }
	public div(this: Expression<IntegerType>, other: ExpressionOrInputValue<IntegerType>): Expression<IntegerType> {
		return new DivisionExpression(this, normalize(tInteger, other)); }

	public toUpper(this: Expression<TextType>): Expression<TextType> { return new KnownFunctionInvocation("upper", [this], tText); }
	public toLower(this: Expression<TextType>): Expression<TextType> { return new KnownFunctionInvocation("lower", [this], tText); }

	public sum(this: Expression<IntegerType>): Expression<IntegerType> { return new KnownFunctionInvocation("sum", [this], tInteger); }
	public count(this: Expression<any>): Expression<IntegerType> { return new KnownFunctionInvocation("count", [this], tInteger); }

	public isLike(this: Expression<TextType>, other: ExpressionOrInputValue<TextType>): Expression<BooleanType> { return new LikeExpression(this, normalize(this.type, other)); }

	public asc(): Ordering<Expression<T>> { return { asc: this } };
	public desc(): Ordering<Expression<T>> { return { desc: this } };

	public toJson<TColumns>(this: Expression<Record<TColumns>>): Expression<Json<RecordTypeToJson<Record<TColumns>>>> {
		return new KnownFunctionInvocation("row_to_json", [this], tJson<RecordTypeToJson<Record<TColumns>>>());
	}

	public prop<TKey extends keyof GetInType<ExpressionTypeOf<this>>>(this: Expression<Json<any>>, key: TKey): Expression<Json<GetInType<ExpressionTypeOf<this>>[TKey]>> {
		return new JsonPropertyAccess(this, key);
	}
}

export class CastExpression<T extends AnyType> extends Expression<T> {
	get precedenceLevel() { return this.expression.precedenceLevel; }

	constructor(public readonly expression: Expression<AnyType>, newType: T) {
		super(newType);
	}
}

export class JsonPropertyAccess extends Expression<Json<any>> {
	constructor(public readonly expression: Expression<Json<any>>, public readonly key: string) {
		super(tJson());
	}
}

export class FromItemExpression<T extends Row> extends Expression<Record<T>> {
	constructor(public readonly fromItem: FromItem<T>) {
		super(tRecord<T>());
	}
}

export function normalize<T extends AnyType>(type: T, expr: ExpressionOrInputValue<T>): Expression<T> {
	if (expr instanceof Expression) return expr;
	return new ValueExpression<T>(type, expr);
}

export function not(expression: Expression<BooleanType>): Expression<BooleanType> {
	return new NotExpression(expression);
}

export function and(expression1: Expression<BooleanType>, ...expressions: Expression<BooleanType>[]): Expression<BooleanType>;
export function and(...expressions: (Expression<BooleanType> | undefined)[]): Expression<BooleanType>|undefined;
export function and(...expressions: (Expression<BooleanType> | undefined)[]): Expression<BooleanType>|undefined {
	return expressions
		.filter(expr => !!expr)
		.reduce((prev, cur) => prev ? prev.and(cur!) : cur, undefined);
}

export function concat(...expressions: ExpressionOrInputValue<TextType>[]): Expression<TextType> {
	return new KnownFunctionInvocation("concat", expressions.map(e => normalize(tText, e)), tText);
}

export function coalesce<T extends AnyType>(...expressions: Expression<T>[]): Expression<T> {
	return new KnownFunctionInvocation("coalesce", expressions, expressions[expressions.length - 1].type);
}

export function val(value: string, preferEscaping?: boolean): ValueExpression<TextType>;
export function val(value: boolean, preferEscaping?: boolean): ValueExpression<BooleanType>;
export function val(value: number, preferEscaping?: boolean): ValueExpression<IntegerType>;
export function val(value: string|boolean|number, preferEscaping: boolean = false) {
	let t: AnyType;
	if (typeof value === "string") t = tText;
	else if (typeof value === "boolean") t = tBoolean;
	else if (typeof value === "number") t = tInteger;
	else throw new Error(`Unsupported value: '${value}'.`);

	return new ValueExpression(t, value, preferEscaping);
}

export function defaultValue(): DefaultExpression { return new DefaultExpression(); }

export function toCondition<TColumns>(fromItem: FromItem<TColumns>|undefined, args: (Expression<BooleanType>[]) | [ Partial<MapExpressionOrInputValue<TColumns>> ])
		: Expression<BooleanType>|undefined {

	const firstArg = args[0];
	if (firstArg && !(firstArg instanceof Expression)) {
		return and(...Object.keys(firstArg).map(columnName => {
			const expression = firstArg[columnName as keyof TColumns];
			if (!fromItem) throw new Error("No table to select from specified.");
			const column = getColumn(fromItem, columnName);
			return column.isEqualTo(expression);
		}));
	}
	else {
		return and(...(args as Expression<BooleanType>[]).map((arg, argIdx) => {
			if (!(arg instanceof Expression))
				throw new Error(`Argument at position '${argIdx}' is not of type expression.`);
			return arg;
		}));
	}
}

export type NamedExpressionNameOf<T extends NamedExpression<any, any>> = T["name"];

export class NamedExpression<TColumnName extends string, T extends AnyType> extends Expression<T> {
	constructor(public readonly name: TColumnName, type: T) { super(type); }
}

export class Column<TColumnName extends string, T extends AnyType> extends NamedExpression<TColumnName, T> {
	private _fromItem: FromItem<any>;
	public get fromItem() { return this._fromItem; }

	constructor(name: TColumnName, type: T, fromItemSetterProvider: (setter: (fromItem: FromItem<any>) => void) => void) {
		super(name, type);

		fromItemSetterProvider(fromItem => this._fromItem = fromItem);
	}
}

export class TableColumn<TColumnName extends string, T extends AnyType> extends Column<TColumnName, T> {
	constructor(name: TColumnName, type: T, fromItemSetterProvider: (setter: (fromItem: Table<any, any>) => void) => void) {
		super(name, type, fromItemSetterProvider);
	}
}

export class AsColumn<TColumnName extends string, T extends AnyType> extends Column<TColumnName, T> {
	constructor(name: TColumnName, type: T, fromItemSetterProvider: (setter: (fromItem: Table<any, any>) => void) => void) {
		super(name, type, fromItemSetterProvider);
	}
}

export class ColumnBoundToExpression<TColumnName extends string, T extends AnyType> extends Column<TColumnName, T> {
	constructor(private readonly expression: NamedExpression<TColumnName, T>, fromItemSetterProvider: (setter: (fromItem: FromItem<any>) => void) => void) {
		super(expression.name, expression.type, fromItemSetterProvider);
	}
}

export class AllExpression<TColumns extends Row> extends Expression<VoidType> {
	constructor(public readonly fromItem: FromItem<TColumns>) {
		super(tVoid);
	}
}

export class NamedExpressionWrapper<TColumnName extends string, T extends AnyType> extends NamedExpression<TColumnName, T> {
	constructor(name: TColumnName, public readonly expression: Expression<T>) { super(name, expression.type); }
}


export class RetrievalQueryAsExpression<T extends AnyType> extends Expression<T> {
	constructor(public readonly query: RetrievalQuery<any, any>, type: T) { super(type); }
}



export class ValueExpression<T extends AnyType> extends Expression<T> {
	constructor(type: T, public readonly value: GetInType<T>, public readonly preferEscaping: boolean = false) { super(type); }
}


export type ExpressionOrInputValue<T extends AnyType> = GetInType<T>|Expression<T>;
export type MapExpressionOrInputValue<T extends { [key: string]: any }> = { [TKey in keyof T]: ExpressionOrInputValue<T[TKey]> };

export class Variable<T extends AnyType> extends Expression<T> {
	private _brand: "Variable";

	constructor(public readonly name: string, type: T) { super(type); }
}

export abstract class BinaryOperatorExpression<TLeft extends AnyType, TRight extends AnyType, TResult extends AnyType> extends Expression<TResult> {
	constructor(
			public readonly left: Expression<TLeft>,
			public readonly right: Expression<TRight>, 
			type: TResult) {

		super(type);
	}

	public abstract get operator(): string;
}

export interface ConcreteBinaryExpression<TLeft extends AnyType, TRight extends AnyType, TResult extends AnyType> extends BinaryOperatorExpression<TLeft, TRight, TResult> {
	operator: string;
	precedenceLevel: number;
}
export interface ConcreteBinaryExpressionStatic<TLeft extends AnyType, TRight extends AnyType, TResult extends AnyType> {
	new (...args: any[]): ConcreteBinaryExpression<TLeft, TRight, TResult>;
}

export function ConcreteBinaryExpression<TLeft extends AnyType, TRight extends AnyType, TResult extends AnyType>(
		symbol: string, resultType: TResult, precedenceLevel: number): ConcreteBinaryExpressionStatic<TLeft, TRight, TResult> {
	return class extends BinaryOperatorExpression<TLeft, TRight, TResult> {
		constructor(left: Expression<TLeft>, right: Expression<TRight>) { super(left, right, resultType); }
		public get operator(): string { return symbol; }
		public get precedenceLevel(): number { return precedenceLevel; }
	};
}

export class AdditionExpression extends ConcreteBinaryExpression<IntegerType, IntegerType, IntegerType>("+", tInteger, 3) {}
export class SubtractionExpression extends ConcreteBinaryExpression<IntegerType, IntegerType, IntegerType>("-", tInteger, 3) {}
export class MultiplicationExpression extends ConcreteBinaryExpression<IntegerType, IntegerType, IntegerType>("*", tInteger, 2) {}
export class DivisionExpression extends ConcreteBinaryExpression<IntegerType, IntegerType, IntegerType>("/", tInteger, 2) {}
export class ModulusExpression extends ConcreteBinaryExpression<IntegerType, IntegerType, IntegerType>("%", tInteger, 2) {}


export class EqualsExpression<T extends AnyType> extends ConcreteBinaryExpression<T, T, BooleanType>("=", tBoolean, 4) {}
export class UnequalsExpression<T extends AnyType> extends ConcreteBinaryExpression<T, T, BooleanType>("!=", tBoolean, 4) {}
export class GreaterExpression<T extends AnyType> extends ConcreteBinaryExpression<T, T, BooleanType>(">", tBoolean, 4) {}
export class LessExpression<T extends AnyType> extends ConcreteBinaryExpression<T, T, BooleanType>("<", tBoolean, 4) {}
export class GreaterOrEqualExpression<T extends AnyType> extends ConcreteBinaryExpression<T, T, BooleanType>(">=", tBoolean, 4) {}
export class LessOrEqualExpression<T extends AnyType> extends ConcreteBinaryExpression<T, T, BooleanType>("<=", tBoolean, 4) {}
export class NotLessExpression<T extends AnyType> extends ConcreteBinaryExpression<T, T, BooleanType>("!<", tBoolean, 4) {}
export class NotGreaterExpression<T extends AnyType> extends ConcreteBinaryExpression<T, T, BooleanType>("!>", tBoolean, 4) {}

export class OrExpression extends ConcreteBinaryExpression<BooleanType, BooleanType, BooleanType>("OR", tBoolean, 7) {}
export class AndExpression extends ConcreteBinaryExpression<BooleanType, BooleanType, BooleanType>("AND", tBoolean, 6) {}

export class LikeExpression extends Expression<BooleanType> {
	public get precedenceLevel() { return 7; }
	constructor(public readonly argument: Expression<TextType>, public readonly like: Expression<TextType>) { super(tBoolean); }
}

export class IsInValuesExpression<T extends AnyType> extends Expression<BooleanType> {
	public get precedenceLevel() { return 7; }

	constructor(public readonly argument: Expression<T>, public readonly values: Expression<T>[]) { super(tBoolean); }
}

export class IsInQueryExpression<T extends AnyType> extends Expression<BooleanType> {
	public get precedenceLevel() { return 7; }

	constructor(public readonly argument: Expression<T>, public readonly query: RetrievalQuery<any, any>) { super(tBoolean); }
}

export class IsNullExpression extends Expression<BooleanType> {
	constructor(public readonly argument: Expression<any>) { super(tBoolean); }
}

export class IsNotNullExpression extends Expression<BooleanType> {
	constructor(public readonly argument: Expression<any>) { super(tBoolean); }
}

export class NotExpression extends Expression<BooleanType> {
	public get precedenceLevel() { return 5; }

	constructor(public readonly argument: Expression<BooleanType>) { super(argument.type); }
}

export class KnownFunctionInvocation<TResultType extends AnyType> extends Expression<TResultType> {
	constructor(public readonly functionName: string, public readonly args: Expression<any>[], resultType: TResultType) { super(resultType); }
}

export class DefaultExpression extends Expression<AnyType> { constructor() { super(tVoid); } }

