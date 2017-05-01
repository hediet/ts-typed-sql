import {
	Expression, NamedExpression, ExpressionOrValue, MapExpressionOrValue,
	ExpressionTypeOf, AllExpression, and, toCondition, Column, NamedExpressionNameOf
} from "../Expressions";
import {
	FromItem, FromFactor, ImplicitColumns, ImplicitColumnsToColumns,
	FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin, FromFactorCrossJoin
} from "../FromFactor";
import { RetrievalQuery } from "./RetrievalQuery";
import { NoColumnsSelected, MoreThanOneColumnSelected, SingleColumn } from "./Query";
import { Ordering, isOrderingAsc, isOrderingDesc } from "../Ordering";
import { Simplify, NmdExpr, NmdExprToImplctColumn, handleSelect, resolveColumnReference, Constructable } from "./Common";
import { JoinMixin, JoinMixinInstance } from "./JoinMixin";
import { WhereMixin, WhereMixinInstance } from "./WhereMixin";
import { secondWithTypeOfFirst } from "../../Helpers";

export class SelectQuery<TSelectedCols extends ImplicitColumns, TFromTblCols extends ImplicitColumns, TSingleColumn extends SingleColumn<TSelectedCols>>
	extends JoinMixin(
		WhereMixin<Constructable<RetrievalQuery<TSelectedCols, TSingleColumn>>, TFromTblCols>(
			RetrievalQuery))
{
	protected _from: FromFactor | undefined = undefined;
	protected _whereCondition: Expression<boolean> | undefined;
	protected lastFromItem: FromItem<TFromTblCols> | undefined;

	private _orderBys: Ordering<Expression<any>>[] = [];
	private _havingCondition: Expression<boolean> | undefined;
	private _groupBys: Expression<any>[] = [];

	public getState() {
		return Object.assign({
			orderBys: this._orderBys,
			whereCondition: this._whereCondition,
			havingCondition: this._havingCondition,
			groupBys: this._groupBys,
			from: this._from
		}, super.getState());
	}

	public from<TTableColumns>(table: FromItem<TTableColumns>):
		SelectQuery<TSelectedCols, TTableColumns, TSingleColumn> {
		this._from = FromFactor.crossJoin(this._from, table);
		this.lastFromItem = table as any;
		return this as any;
	}

	/** Selects all columns from the given table. */
	public select<T extends ImplicitColumns>(table: AllExpression<T>): SelectQuery<Simplify<TSelectedCols & {[TName in keyof T]: T[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single named expression. */
	public select<T1 extends NmdExpr>(this: SelectQuery<TSelectedCols, TFromTblCols, NoColumnsSelected> | void, expr1: T1): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1>>, TFromTblCols, NamedExpressionNameOf<T1>>;

	/** Selects 1 named expressions. */
	public select<T1 extends NmdExpr>(expr1: T1): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 2 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 3 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 4 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 5 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 6 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 7 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6> & NmdExprToImplctColumn<T7>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects 8 named expressions. */
	public select<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr, T8 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7, expr8: T8): SelectQuery<Simplify<TSelectedCols & NmdExprToImplctColumn<T1> & NmdExprToImplctColumn<T2> & NmdExprToImplctColumn<T3> & NmdExprToImplctColumn<T4> & NmdExprToImplctColumn<T5> & NmdExprToImplctColumn<T6> & NmdExprToImplctColumn<T7> & NmdExprToImplctColumn<T8>>, TFromTblCols, MoreThanOneColumnSelected>;

	/** Selects a single column that is currently in scope. */
	public select<TColumnName extends keyof TFromTblCols>(this: SelectQuery<TSelectedCols, TFromTblCols, NoColumnsSelected>, column1: TColumnName): SelectQuery<Simplify<TSelectedCols & {[TName in TColumnName]: TFromTblCols[TName]}>, TFromTblCols, TColumnName>;

	/** Selects columns that are currently in scope. */
	public select<TColumnNames extends keyof TFromTblCols>(...columns: TColumnNames[]): SelectQuery<Simplify<TSelectedCols & {[TName in TColumnNames]: TFromTblCols[TName]}>, TFromTblCols, MoreThanOneColumnSelected>;

	public select(...args: ((keyof TFromTblCols) | NmdExpr | AllExpression<any>)[]): any {
		handleSelect(this.lastFromItem, this.columns as any, this.selectedColumns, args);
		return this;
	}

	public orderBy(...expressions: (
		Ordering<(Expression<any> | keyof TFromTblCols)> | Expression<any> | keyof TFromTblCols
	)[]): this;
	public orderBy(expressionSelector: (selectedColumns: ImplicitColumnsToColumns<TSelectedCols>)
		=> (Ordering<Expression<any>> | Expression<any>)[] | (Ordering<Expression<any>> | Expression<any>)): this;
	public orderBy(...expressions: any[]): this {

		const expressions2 = ((): (Ordering<(Expression<any> | keyof TFromTblCols)> | Expression<any> | keyof TFromTblCols)[] => {
			const firstExpr = expressions[0];
			if (firstExpr && (typeof firstExpr) === "function") {
				const expr = firstExpr(this.columns);
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

	public having(conditionSelector: (selectedColumns: ImplicitColumnsToColumns<TSelectedCols>) => Expression<boolean>): this;
	public having(condition: Expression<boolean>, ...conditions: Expression<boolean>[]): this;

	public having(...args: any[]): this {
		let expression: Expression<boolean> | undefined = undefined;
		if ((typeof args[0]) === "function") {
			const func = args[0];
			expression = func(this.columns);
		}
		else
			expression = toCondition(this.lastFromItem, args);

		this._havingCondition = and(this._havingCondition, expression);
		return this;
	}

	public groupBy(...expressions: (Expression<any> | keyof TFromTblCols)[]): this;
	public groupBy(expressionSelector: (selectedColumns: ImplicitColumnsToColumns<TSelectedCols>) => Expression<any> | Expression<any>[]): this;
	public groupBy(...expressions: any[]): this {
		const exprs = (() => {
			const firstExpr = expressions[0];
			if ((typeof firstExpr) === "function") {
				let result = firstExpr(this.columns);
				if (Array.isArray(result)) return result;
				return [result];
			}
			else return expressions.map(e => resolveColumnReference(this.lastFromItem, e));
		})();

		this._groupBys.push(...exprs);
		return this;
	}
}

export function from<TTableColumns>(table: FromItem<TTableColumns>) {
	const result = new SelectQuery<{}, {}, NoColumnsSelected>();
	return result.from(table);
}

export const select = secondWithTypeOfFirst(new SelectQuery<{}, {}, NoColumnsSelected>().select, function (...args: any[]): any {
	const result = new SelectQuery<{}, {}, NoColumnsSelected>();
	return result.select.call(result, ...args);
});
