import { FromItem, Row, FromFactor } from "../FromFactor";
import { Table } from "../Table";
import { ExpressionOrInputValue, AllExpression, NamedExpression, Expression, NamedExpressionNameOf } from "../Expressions";
import { Query, NoColumnsSelected, MoreThanOneColumnSelected, SingleColumn } from "./Query";
import { NmdExpr, Simplify, NmdExprToRow, resolveColumnReference, handleSelect, Constructable, ErrorMessage } from "./Common";
import { JoinMixin, JoinMixinInstance } from "./JoinMixin";
import { WhereMixin, WhereMixinInstance } from "./WhereMixin";
import { combine } from "../../Helpers";
import { BooleanType } from "../Types";

/**
 * Creates a DELETE FROM statement.
 * 
 * @param table The table to delete from.
 */
export function deleteFrom<T extends Row>(table: FromItem<T> & Table<any, any>): DeleteQuery<T, {}, NoColumnsSelected> {
	return new DeleteQuery<T, {}, NoColumnsSelected>(table);
}

/**
 * Represents a DELETE FROM query.
 */
export class DeleteQuery<TLastFromRow extends Row, TReturningRow extends Row, TSingleColumn extends SingleColumn<TReturningRow>>
	extends JoinMixin(WhereMixin<Constructable<Query<TReturningRow, TSingleColumn>>, TLastFromRow>(Query)) {

	protected _from: FromFactor | undefined = undefined;
	protected _whereCondition: Expression<BooleanType> | undefined;
	protected lastFromItem: FromItem<TLastFromRow> | undefined;

	constructor(private readonly table: FromItem<any> & Table<any, any>) {
		super();
		this.lastFromItem = table;
	}

	public getState() {
		return combine(super.getState(), {
			table: this.table,
			using: this._from,
			whereCondition: this._whereCondition
		});
	}

	/**
	 * Brings an additional query into scope that can be used to specify more complex delete conditions.
	 * 
	 * @param fromItem The query to use.
	 */
	public using<TFromRow extends Row>(fromItem: FromItem<TFromRow>): DeleteQuery<TFromRow, TReturningRow, TSingleColumn> {
		this._from = FromFactor.crossJoin(this._from, fromItem);
		this.lastFromItem = fromItem as any;
		return this as any;
	}

	/** Selects all columns from the given table. */
	public returning<T extends Row>(table: AllExpression<T>): DeleteQuery<TLastFromRow, TReturningRow & {[TName in keyof T]: T[TName]}, MoreThanOneColumnSelected>;

	/** Selects a single named expression. */
	public returning<T1 extends NmdExpr>(this: DeleteQuery<TLastFromRow, TReturningRow, NoColumnsSelected> | void, expr1: T1): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1>, NamedExpressionNameOf<T1>>;

	/** Selects 1 named expressions. */
	public returning<T1 extends NmdExpr>(expr1: T1): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1>, MoreThanOneColumnSelected>;

	/** Selects 2 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr>(expr1: T1, expr2: T2): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1> & NmdExprToRow<T2>, MoreThanOneColumnSelected>;

	/** Selects 3 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3>, MoreThanOneColumnSelected>;

	/** Selects 4 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4>, MoreThanOneColumnSelected>;

	/** Selects 5 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5>, MoreThanOneColumnSelected>;

	/** Selects 6 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6>, MoreThanOneColumnSelected>;

	/** Selects 7 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7>, MoreThanOneColumnSelected>;

	/** Selects 8 named expressions. */
	public returning<T1 extends NmdExpr, T2 extends NmdExpr, T3 extends NmdExpr, T4 extends NmdExpr, T5 extends NmdExpr, T6 extends NmdExpr, T7 extends NmdExpr, T8 extends NmdExpr>(expr1: T1, expr2: T2, expr3: T3, expr4: T4, expr5: T5, expr6: T6, expr7: T7, expr8: T8): DeleteQuery<TLastFromRow, TReturningRow & NmdExprToRow<T1> & NmdExprToRow<T2> & NmdExprToRow<T3> & NmdExprToRow<T4> & NmdExprToRow<T5> & NmdExprToRow<T6> & NmdExprToRow<T7> & NmdExprToRow<T8>, MoreThanOneColumnSelected>;

	/** Selects a single column that is currently in scope. */
	public returning<TColumnName extends keyof TLastFromRow>(this: DeleteQuery<TLastFromRow, TReturningRow, NoColumnsSelected>, column1: TColumnName): DeleteQuery<TLastFromRow, TReturningRow & {[TName in TColumnName]: TLastFromRow[TName]}, TColumnName>;

	/** Selects columns that are currently in scope. */
	public returning<TColumnNames extends keyof TLastFromRow>(...columns: TColumnNames[]): DeleteQuery<TLastFromRow, TReturningRow & {[TName in TColumnNames]: TLastFromRow[TName]}, MoreThanOneColumnSelected>;

	public returning(this: ErrorMessage<"Expressions must have names. Use expr.as('name').">, ...expr: Expression<any>[]): "Error";

	public returning(...args: ((keyof TLastFromRow) | NmdExpr | AllExpression<any> | Expression<any>)[]): any {
		handleSelect(this.lastFromItem, args as any, this.returningColumns as any, this.selectedExpressions);
		return this;
	}
}
