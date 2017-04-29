import { Ordering } from "./Ordering";
import { FromItem, ImplicitColumns, getColumn, Record } from "./FromFactor";
import { RetrievalQuery } from "./Queries/RetrievalQuery";
import { Table } from "./Table";

export type ExpressionTypeOf<T extends Expression<any>> = T["_type"];

export abstract class Expression<T> {
	_type: T;

	public get precedenceLevel(): number { return 0; }

	public cast<T2>(): Expression<T2> { return this as any; }
	public narrow<T2 extends T>(): Expression<T2> { return this as any; }

	public as<TName extends string>(name: TName): NamedExpression<TName, T> {
		return new NamedExpressionWrapper<TName, T>(name, this); }

	public isEqualTo(other: ExpressionOrValue<T>): Expression<boolean> {
		return new EqualsExpression(this, normalize(other)); }
	public isNotEqualTo(other: ExpressionOrValue<T>): Expression<boolean> {
		return new UnequalsExpression(this, normalize(other)); }

	public isLessThan(other: ExpressionOrValue<T>): Expression<boolean> {
		return new LessExpression(this, normalize(other)); }
	public isAtMost(other: ExpressionOrValue<T>): Expression<boolean> {
		return new LessOrEqualExpression(this, normalize(other)); }
	public isGreaterThan(other: ExpressionOrValue<T>): Expression<boolean> {
		return new GreaterExpression(this, normalize(other)); }
	public isAtLeast(other: ExpressionOrValue<T>): Expression<boolean> {
		return new GreaterOrEqualExpression(this, normalize(other)); }

	public isNull(): Expression<boolean> { return new IsNullExpression(this); }
	public isNotNull(): Expression<boolean> { return new IsNotNullExpression(this); }

	public and(this: Expression<boolean>, other: Expression<boolean>): Expression<boolean> {
		return new AndExpression(this, other); }
	public or(this: Expression<boolean>, other: Expression<boolean>): Expression<boolean> {
		return new OrExpression(this, other); }

	public not(this: Expression<boolean>): Expression<boolean> { return new NotExpression(this); }

	public isIn(values: ExpressionOrValue<T>[]): Expression<boolean> { return new IsInValuesExpression(this, values.map(v => normalize(v))); }
	public isInQuery<TColumns, TSingleColumn extends keyof TColumns>(this: Expression<TColumns[TSingleColumn]>,
		values: RetrievalQuery<TColumns, TSingleColumn>): Expression<boolean> { return new IsInQueryExpression(this, values); }
	
	public minus(this: Expression<number>, other: ExpressionOrValue<number>): Expression<number> {
		return new SubtractionExpression(this, normalize(other)); }
	public plus(this: Expression<number>, other: ExpressionOrValue<number>): Expression<number> {
		return new AdditionExpression(this, normalize(other)); }
	public mult(this: Expression<number>, other: ExpressionOrValue<number>): Expression<number> {
		return new MultiplicationExpression(this, normalize(other)); }
	public div(this: Expression<number>, other: ExpressionOrValue<number>): Expression<number> {
		return new DivisionExpression(this, normalize(other)); }

	public toUpper(this: Expression<string>): Expression<string> { return new KnownFunctionInvocation("upper", [this]); }
	public toLower(this: Expression<string>): Expression<string> { return new KnownFunctionInvocation("lower", [this]); }

	public sum(this: Expression<number>): Expression<number> { return new KnownFunctionInvocation("sum", [this]); }
	public count(this: Expression<any>): Expression<number> { return new KnownFunctionInvocation("count", [this]); }

	public isLike(this: Expression<string>, other: ExpressionOrValue<string>): Expression<boolean> { return new LikeExpression(this, normalize(other)); }

	public asc(): Ordering<Expression<T>> { return { asc: this } };
	public desc(): Ordering<Expression<T>> { return { desc: this } };

	// todo: public toJson<TColumns>(this: Expression<Record<TColumns>>): Expression<Json<TColumns>> {}
}

export function normalize<T>(expr: ExpressionOrValue<T>): Expression<T> {
	if (expr instanceof Expression) return expr;
	return val(expr);
}

export function not(expression: Expression<boolean>): Expression<boolean> {
	return new NotExpression(expression);
}

export function and(expression1: Expression<boolean>, ...expressions: Expression<boolean>[]): Expression<boolean>;
export function and(...expressions: (Expression<boolean> | undefined)[]): Expression<boolean>|undefined;
export function and(...expressions: (Expression<boolean> | undefined)[]): Expression<boolean>|undefined {
	return expressions
		.filter(expr => !!expr)
		.reduce((prev, cur) => prev ? prev.and(cur!) : cur, undefined);
}

export function concat(...expressions: ExpressionOrValue<string>[]): Expression<string> {
	return new KnownFunctionInvocation("concat", expressions.map(e => normalize(e)));
}

export function coalesce<T>(...expressions: ExpressionOrValue<T>[]): Expression<T> {
	return new KnownFunctionInvocation("coalesce", expressions.map(e => normalize(e)));
}

export function val<T>(value: T, preferEscaping: boolean = false) { return new ValueExpression(value, preferEscaping); }

export function defaultValue(): DefaultExpression { return new DefaultExpression(); }

export function toCondition<TColumns>(fromItem: FromItem<TColumns>|undefined, args: (Expression<boolean>[]) | [ Partial<MapExpressionOrValue<TColumns>> ])
		: Expression<boolean>|undefined {

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
		return and(...(args as Expression<boolean>[]).map((arg, argIdx) => {
			if (!(arg instanceof Expression))
				throw new Error(`Argument at position '${argIdx}' is not of type expression.`);
			return arg;
		}));
	}
}


export type NamedExpressionNameOf<T extends NamedExpression<any, any>> = T["name"];

export class NamedExpression<TColumnName extends string, T> extends Expression<T> {
	constructor(public readonly name: TColumnName) { super(); }
}

export class Column<TColumnName extends string, T> extends NamedExpression<TColumnName, T> {
	public readonly fromItem: FromItem<any>;

	constructor(name: TColumnName, fromItemSetterProvider: (setter: (fromItem: FromItem<any>) => void) => void) {
		super(name);

		fromItemSetterProvider(fromItem => Object.assign(this, { fromItem: fromItem }));
	}
}

export class TableColumn<TColumnName extends string, T> extends Column<TColumnName, T> {
	constructor(name: TColumnName, fromItemSetterProvider: (setter: (fromItem: Table<any, any>) => void) => void) {
		super(name, fromItemSetterProvider);
	}
}

export class AsColumn<TColumnName extends string, T> extends Column<TColumnName, T> {
	constructor(name: TColumnName, fromItemSetterProvider: (setter: (fromItem: Table<any, any>) => void) => void) {
		super(name, fromItemSetterProvider);
	}
}

export class ColumnBoundToExpression<TColumnName extends string, T> extends Column<TColumnName, T> {
	constructor(private readonly expression: NamedExpression<any, TColumnName>, fromItemSetterProvider: (setter: (fromItem: FromItem<any>) => void) => void) {
		super(expression.name, fromItemSetterProvider);
	}
}

export class AllExpression<TColumns extends ImplicitColumns> extends Expression<void> {
	constructor(public readonly fromItem: FromItem<TColumns>) {
		super();
	}
}

export class NamedExpressionWrapper<TColumnName extends string, T> extends NamedExpression<TColumnName, T> {
	constructor(name: TColumnName, public readonly expression: Expression<T>) { super(name); }
}


export class RetrievalQueryAsExpression<T> extends Expression<T> {
	constructor(public readonly query: RetrievalQuery<any, any>) { super(); }
}



export class ValueExpression<T> extends Expression<T> {
	constructor(public readonly value: T, public readonly preferEscaping: boolean = false) { super(); }
}


export type ExpressionOrValue<T> = T|Expression<T>;
export type MapExpressionOrValue<T extends { [key: string]: any }> = { [TKey in keyof T]: ExpressionOrValue<T[TKey]> };

export class Variable<T> extends Expression<T> {
	private _brand: "Variable";

	constructor(public readonly name: string) { super(); }
}

export abstract class BinaryOperatorExpression<TLeft, TRight, TResult> extends Expression<TResult> {
	constructor(
			public readonly left: Expression<TLeft>,
			public readonly right: Expression<TRight>) {

		super();
	}

	public abstract get operator(): string;
}

export interface ConcreteBinaryExpression<TLeft, TRight, TResult> extends BinaryOperatorExpression<TLeft, TRight, TResult> {
	operator: string;
	precedenceLevel: number;
}
export interface ConcreteBinaryExpressionStatic<TLeft, TRight, TResult> {
	new (...args: any[]): ConcreteBinaryExpression<TLeft, TRight, TResult>;
}

export function ConcreteBinaryExpression<TLeft, TRight, TResult>(symbol: string, precedenceLevel: number): ConcreteBinaryExpressionStatic<TLeft, TRight, TResult> {
	return class extends BinaryOperatorExpression<TLeft, TRight, TResult> {
		public get operator(): string { return symbol; }
		public get precedenceLevel(): number { return precedenceLevel; }
	};
}

export class AdditionExpression extends ConcreteBinaryExpression<number, number, number>("+", 3) {}
export class SubtractionExpression extends ConcreteBinaryExpression<number, number, number>("-", 3) {}
export class MultiplicationExpression extends ConcreteBinaryExpression<number, number, number>("*", 2) {}
export class DivisionExpression extends ConcreteBinaryExpression<number, number, number>("/", 2) {}
export class ModulusExpression extends ConcreteBinaryExpression<number, number, number>("%", 2) {}


export class EqualsExpression<T> extends ConcreteBinaryExpression<T, T, boolean>("=", 4) {}
export class UnequalsExpression<T> extends ConcreteBinaryExpression<T, T, boolean>("!=", 4) {}
export class GreaterExpression<T> extends ConcreteBinaryExpression<T, T, boolean>(">", 4) {}
export class LessExpression<T> extends ConcreteBinaryExpression<T, T, boolean>("<", 4) {}
export class GreaterOrEqualExpression<T> extends ConcreteBinaryExpression<T, T, boolean>(">=", 4) {}
export class LessOrEqualExpression<T> extends ConcreteBinaryExpression<T, T, boolean>("<=", 4) {}
export class NotLessExpression<T> extends ConcreteBinaryExpression<T, T, boolean>("!<", 4) {}
export class NotGreaterExpression<T> extends ConcreteBinaryExpression<T, T, boolean>("!>", 4) {}

export class OrExpression extends ConcreteBinaryExpression<boolean, boolean, boolean>("OR", 7) {}
export class AndExpression extends ConcreteBinaryExpression<boolean, boolean, boolean>("AND", 6) {}

export class LikeExpression extends Expression<boolean> {
	public get precedenceLevel() { return 7; }
	constructor(public readonly argument: Expression<string>, public readonly like: Expression<string>) { super(); }
}

export class IsInValuesExpression<T> extends Expression<boolean> {
	public get precedenceLevel() { return 7; }

	constructor(public readonly argument: Expression<T>, public readonly values: Expression<T>[]) { super(); }
}

export class IsInQueryExpression<T> extends Expression<boolean> {
	public get precedenceLevel() { return 7; }

	constructor(public readonly argument: Expression<T>, public readonly query: RetrievalQuery<any, any>) { super(); }
}

export class IsNullExpression extends Expression<boolean> {
	constructor(public readonly argument: Expression<any>) { super(); }
}

export class IsNotNullExpression extends Expression<boolean> {
	constructor(public readonly argument: Expression<any>) { super(); }
}

export class NotExpression extends Expression<boolean> {
	public get precedenceLevel() { return 5; }

	constructor(public readonly argument: Expression<boolean>) { super(); }
}

export class KnownFunctionInvocation extends Expression<any> {
	constructor(public readonly functionName: string, public readonly args: Expression<any>[]) { super(); }
}

export class DefaultExpression extends Expression<any> {}

