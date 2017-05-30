import { BooleanType, AnyType } from '../Types';
import {
	Expression, NamedExpression, ExpressionOrInputValue, MapExpressionOrInputValue,
	ExpressionTypeOf, AllExpression, and, toCondition, Column, NamedExpressionNameOf
} from "../Expressions";
import {
	FromItem, FromFactor, Row, RowToColumns,
	FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin, FromFactorCrossJoin, HardRow
} from "../FromFactor";
import { RetrievalQuery } from "./RetrievalQuery";
import { NoColumnsSelected, MoreThanOneColumnSelected, SingleColumn } from "./Query";
import { Ordering, isOrderingAsc, isOrderingDesc } from "../Ordering";
import { Simplify, NmdExpr, NmdExprToRow, handleSelect, resolveColumnReference, Constructable } from "./Common";
import { JoinMixin, JoinMixinInstance } from "./JoinMixin";
import { WhereMixin, WhereMixinInstance } from "./WhereMixin";
import { secondWithTypeOfFirst } from "../../Helpers";

export interface ErrorMessage<TMsg> { msg: TMsg; }

export class SelectQuery<TSelectedCols extends Row, TFromTblCols extends Row, TSingleColumn extends SingleColumn<TSelectedCols>>
	extends JoinMixin(
		WhereMixin<Constructable<RetrievalQuery<TSelectedCols, TSingleColumn>>, TFromTblCols>(
			RetrievalQuery))
{
	protected _from: FromFactor | undefined = undefined;
	protected _whereCondition: Expression<BooleanType> | undefined;
	protected lastFromItem: FromItem<TFromTblCols> | undefined;

	private _orderBys: Ordering<Expression<AnyType>>[] = [];
	private _havingCondition: Expression<BooleanType> | undefined;
	private _groupBys: Expression<AnyType>[] = [];

	public getState() {
		return Object.assign({
			orderBys: this._orderBys,
			whereCondition: this._whereCondition,
			havingCondition: this._havingCondition,
			groupBys: this._groupBys,
			from: this._from
		}, super.getState());
	}

	/**
	 * Selects from a table. If previous tables are already specified, they are cross joined.
	 * @param table The table to select from.
	 */
	public from<TTableColumns extends HardRow>(table: FromItem<TTableColumns>):
		SelectQuery<TSelectedCols, TTableColumns, TSingleColumn> {
		this._from = FromFactor.crossJoin(this._from, table);
		this.lastFromItem = table as any;
		return this as any;
	}


	/** Selects all columns from the given table. */
	public select<T extends Row>(table: AllExpression<T>): SelectQuery<Simplify<TSelectedCols & {[TName in keyof T]: T[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single named expression. */
	public select<T1 extends NmdExpr>(this: SelectQuery<TSelectedCols, TFromTblCols, NoColumnsSelected> | void, expr1: T1): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1>>, TFromTblCols, NamedExpressionNameOf<T1>>;

	/** Selects 1 named expressions. */
	public select<T1 extends NmdExpr>(expr1: T1): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 2 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1> & NmdExprToRow<T2>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 3 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 4 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 5 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 6 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 7 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 8 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr, T8 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7, expr8: T8): SelectQuery<Simplify<TSelectedCols & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7> & NmdExprToRow<T8>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single column that is currently in scope. */
	public select<TColumnName extends keyof TFromTblCols>(this: SelectQuery<TSelectedCols, TFromTblCols, NoColumnsSelected>, column1: TColumnName): SelectQuery<Simplify<TSelectedCols & {[TName in TColumnName]: TFromTblCols[TName]}>, TFromTblCols, TColumnName>;

	/** Selects columns that are currently in scope. */
	public select<TColumnNames extends keyof TFromTblCols>(...columns: TColumnNames[]): SelectQuery<Simplify<TSelectedCols & {[TName in TColumnNames]: TFromTblCols[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;
	
	public select(this: ErrorMessage<"Expressions must have names. Use expr.as('name').">, ...expr: Expression<AnyType>[]);

	public select(...args: ((keyof TFromTblCols) | NmdExpr | AllExpression<any>)[]): any {
		handleSelect(this.lastFromItem, args, this.returningColumns as any, this.selectedExpressions);
		return this;
	}

	/**
	 * Adds expressions to the order-by list of this query.
	 * Use `expression.desc()` or `{ desc: "columnName" }` for descending order.
	 * @param expressions The expressions to add to the order-by list.
	 */
	public orderBy(...expressions: (
		Ordering<(Expression<any> | keyof TFromTblCols)> | Expression<any> | keyof TFromTblCols
	)[]): this;
	/**
	 * Adds expressions to the order-by list of this query. The `expressionSelector` can be used to refer to already selected expressions.
	 * @param expressionSelector A selector that must return the expressions to add to the order-by list.
	 */
	public orderBy(expressionSelector: (selectedColumns: RowToColumns<TSelectedCols>)
		=> (Ordering<Expression<any>> | Expression<any>)[] | (Ordering<Expression<any>> | Expression<any>)): this;
	public orderBy(...expressions: any[]): this {

		const expressions2 = ((): (Ordering<(Expression<any> | keyof TFromTblCols)> | Expression<any> | keyof TFromTblCols)[] => {
			const firstExpr = expressions[0];
			if (firstExpr && (typeof firstExpr) === "function") {
				const expr = firstExpr(this.returningColumns);
				if (Array.isArray(expr)) return expr;
				return [ expr ];
			}
			return expressions;
		})();

		const exprs = expressions2.map(e => {
			if (typeof e === "string") return resolveColumnReference(this.lastFromItem, e).asc();
			if (e instanceof Expression) return e.asc();
			if (isOrderingAsc(e)) return resolveColumnReference(this.lastFromItem, e.asc).asc();
			if (isOrderingDesc(e)) return resolveColumnReference(this.lastFromItem, e.desc).desc();
			throw new Error(`Unexpected value in orderBy: '${e}'.`);
		});

		this._orderBys.push(...exprs);
		return this;
	}

	/**
	 * Adds having-conditions.
	 * In contrast to where-conditions, having-conditions are evaluated after grouping is done.
	 * @param conditionSelector 
	 */
	public having(condition: Expression<BooleanType>, ...conditions: Expression<BooleanType>[]): this;

	/**
	 * Adds having-conditions.
	 * In contrast to where-conditions, having-conditions are evaluated after grouping is done.
	 * @param conditionSelector 
	 */
	public having(conditionSelector: (selectedColumns: RowToColumns<TSelectedCols>) => Expression<BooleanType>): this;
	public having(...args: any[]): this {
		let expression: Expression<BooleanType> | undefined = undefined;
		if ((typeof args[0]) === "function") {
			const func = args[0];
			expression = func(this.returningColumns);
		}
		else
			expression = toCondition(this.lastFromItem, args);

		this._havingCondition = and(this._havingCondition, expression);
		return this;
	}

	/**
	 * Adds expressions to the group-by list of this query.
	 * @param expressions The expressions to add.
	 */
	public groupBy(...expressions: (Expression<AnyType> | keyof TFromTblCols)[]): this;

	/**
	 * Adds expressions to the group-by list of this query. The `expressionSelector` can be used to refer to already selected expressions.
	 * @param expressionSelector A selector that must return the expressions to add to the group-by list.
	 */
	public groupBy(expressionSelector: (selectedColumns: RowToColumns<TSelectedCols>) => Expression<AnyType> | Expression<AnyType>[]): this;
	public groupBy(...expressions: any[]): this {
		const exprs = (() => {
			const firstExpr = expressions[0];
			if ((typeof firstExpr) === "function") {
				let result = firstExpr(this.returningColumns);
				if (Array.isArray(result)) return result;
				return [result];
			}
			else return expressions.map(e => resolveColumnReference(this.lastFromItem, e));
		})();

		this._groupBys.push(...exprs);
		return this;
	}
}

/**
 * Creates a SELECT query that selects from the given table.
 * @param table The table to select from.
 */
export function from<TTableColumns extends HardRow>(table: FromItem<TTableColumns>) {
	const result = new SelectQuery<{}, {}, NoColumnsSelected>();
	return result.from(table);
}

export const select = secondWithTypeOfFirst(new SelectQuery<{}, {}, NoColumnsSelected>().select, function (...args: any[]): any {
	const result = new SelectQuery<{}, {}, NoColumnsSelected>();
	return result.select.call(result, ...args);
});
