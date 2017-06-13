import { Expression, Column, NamedExpression, NamedExpressionNameOf, ExpressionTypeOf, AllExpression } from "../Expressions";
import { FromItem, HardRow } from "../FromFactor";
import { objectValues } from "../../Helpers";
import { AnyType } from "../Types";

/**
 * Used to report error messages through overloading.
 */
export interface ErrorMessage<TMsg> { msg: TMsg; }

/**
 * An helper for mixins.
 * @private
 */
export type Constructable<T> = new (...args: any[]) => T;

/**
 * If `expression` is a string, it returns the column from `fromItem` that has the name `expression` (or throws an exception).
 * Otherwise, it ensures that `expression` is an `Expression` and returns it.
 * @private
 */
export function resolveColumnReference<TExpr extends Expression<any>, TFromTblCols extends HardRow>(
	fromItem: FromItem<TFromTblCols> | undefined, expression: TExpr | keyof TFromTblCols): TExpr | Column<string, AnyType> {

	if (expression instanceof Expression) return expression;

	if (typeof expression !== "string") throw new Error(`Expression must be either of type string or of type Expression, but was '${expression}'.`);

	if (!fromItem) {
		throw new Error(`Columns cannot be referenced by string if no table is specified to select from. `
			+ `Use method 'from' before.`);
	}

	const column = fromItem.$columns[expression] as Column<string, any>;
	if (!column) throw new Error(`Column with name '${expression}' does not exist on last table that has been specified in from.`);
	return column;
}

/**
 * An helper method for select or returning.
 * @private
 */
export function handleSelect<TFromTblCols extends HardRow>(
	fromItem: FromItem<TFromTblCols> | undefined,
	selectedExpressions: ((keyof TFromTblCols) | NmdExpr | AllExpression<object>)[],
	allReturningColumns: { [exprName: string]: NamedExpression<string, AnyType> },
	allSelectedExpressions: (NamedExpression<string, AnyType> | AllExpression<object>)[]) {

	const normalizedExpressions = selectedExpressions.map(arg => resolveColumnReference<NmdExpr | AllExpression<object>, TFromTblCols>(fromItem, arg));

	for (const expr of normalizedExpressions) {
		if (!(expr instanceof NamedExpression || expr instanceof AllExpression))
			throw new Error(`Given argument '${expr}' must be a named or an all expression.`);
	}

	for (const expr of normalizedExpressions) {
		for (const col of (expr instanceof AllExpression) ? objectValues(expr.fromItem.$columns) as Column<string, AnyType>[] : [expr])
			allReturningColumns[col.name] = col;

		allSelectedExpressions.push(expr);
	}
}


/**
 * A functor that forces typescript to resolve `|` and `&` operators.
 * @private
 */
export type Simplify<T> = {[TKey in keyof T]: T[TKey]};

/**
 * A short form for `NamedExpression<any, any>`.
 * @private
 */
export type NmdExpr = NamedExpression<string, AnyType>;

/**
 * 
 * @private
 */
export type NmdExprToRow<TCol extends NmdExpr> =
	{[TKey in NamedExpressionNameOf<TCol>]: ExpressionTypeOf<TCol> };