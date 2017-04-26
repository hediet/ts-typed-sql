import { Expression, Column, NamedExpression, NamedExpressionNameOf, ExpressionTypeOf, AllExpression } from "../Expressions";
import { FromItem } from "../FromFactor";

export type Constructable<T> = new (...args: any[]) => T;

export function resolveColumnReference<TExpr extends Expression<any>, TFromTblCols>(
		fromItem: FromItem<TFromTblCols>|undefined, expression: TExpr | keyof TFromTblCols): TExpr|Column<any, any> {

	if (expression instanceof Expression) return expression;

	if (typeof expression !== "string") throw new Error(`Expression must be either of type string or of type Expression, but was '${expression}'.`);

	if (!fromItem) {
		throw new Error(`Columns cannot be referenced by string if no table is specified to select from. `
			+ `Use method 'from' before.`);
	}

	const column = fromItem.$columns[expression] as Column<any, any>;
	if (!column) throw new Error(`Column with name '${expression}' does not exist on last table that has been specified in from.`);
	return column;
}


export function handleSelect<TFromTblCols>(
		fromItem: FromItem<TFromTblCols>|undefined,
		resultColumns: { [exprName: string]: NamedExpression<any, any> },
		selectedExpressions: (NamedExpression<any, any>|AllExpression<any>)[],
		...args: ((keyof TFromTblCols)|NmdExpr|AllExpression<any>)[]) {

	const normalizedExpressions = args.map(arg => resolveColumnReference<NmdExpr|AllExpression<any>, TFromTblCols>(fromItem, arg));

	for (const expr of normalizedExpressions) {
		if (!(expr instanceof NamedExpression || expr instanceof AllExpression))
			throw new Error(`Given argument '${expr}' must be a named or an all expression.`);
	}

	for (const expr of normalizedExpressions) {
		for (const col of (expr instanceof AllExpression) ? Object.values(expr.fromItem.$columns) as Column<any, any>[] : [expr])
			resultColumns[col.name] = col;

		selectedExpressions.push(expr);
	}
}

export type NmdExpr = NamedExpression<any, any>;
export type Simplify<T> = {[TKey in keyof T]: T[TKey]}
export type NmdExprToImplctColumn<TCol extends NmdExpr> =
	{[TKey in NamedExpressionNameOf<TCol>]: ExpressionTypeOf<TCol> };