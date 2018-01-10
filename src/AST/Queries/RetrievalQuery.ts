import { IntegerType, tInteger } from '../Types';
import { Query, SingleColumn } from "./Query";
import { Expression, ExpressionOrInputValue, RetrievalQueryAsExpression, Variable, normalize, AllExpression, NamedExpression } from "../Expressions";
import { FromItem, Row, getColumn } from "../FromFactor";

export class RetrievalQuery<TRow extends Row, TSingleColumn extends SingleColumn<TRow>> extends Query<TRow, TSingleColumn> {
	private _limit: Expression<IntegerType> | undefined;
	private _offset: Expression<IntegerType> | undefined;

	public getState() {
		return Object.assign({
			limit: this._limit,
			offset: this._offset
		}, super.getState());
	}

	/**
	 * Sets an limit on how many rows are returned.
	 * Overwrites any limit that was set before.
	 * 
	 * @param count The limit.
	 */
	public limit(count: ExpressionOrInputValue<IntegerType>): this {
		this._limit = normalize(tInteger, count);
		return this;
	}

	/**
	 * Sets how many rows are skipped.
	 * Overwrites any offset that was set before.
	 * 
	 * @param count The offset.
	 */
	public offset(count: ExpressionOrInputValue<IntegerType>): this {
		this._offset = normalize(tInteger, count);
		return this;
	}

	/**
	 * Wraps this query as expression. The query must return exactly one row with exactly one column.
	 */
	public asExpression<TSingleColumn2 extends keyof TRow>
		(this: RetrievalQuery<TRow, TSingleColumn2>): Expression<TRow[TSingleColumn2]> {
		const column = this.returningColumns[this.singleColumn];
		return new RetrievalQueryAsExpression<TRow[TSingleColumn2]>(this, column.type);
	}
}


export class UnionQuery<TColumns, TSingleColumn extends SingleColumn<TColumns>> extends RetrievalQuery<TColumns, TSingleColumn> {
	constructor(public readonly query1: RetrievalQuery<TColumns, TSingleColumn>, public readonly query2: RetrievalQuery<TColumns, any>, public readonly isUnionAll: boolean) {
		super();

		const s = query1.getState();
		this.returningColumns = s.returningColumns;
		this.selectedExpressions = s.selected;
	}
}

export function union<TColumns, TSingleColumn extends SingleColumn<TColumns>>(query1: RetrievalQuery<TColumns, TSingleColumn>, ...queries: RetrievalQuery<any, any>[])
: RetrievalQuery<TColumns, TSingleColumn> {

	return queries.reduce((p, c) => new UnionQuery(p, c, false), query1);
}

export function unionAll<TColumns, TSingleColumn extends SingleColumn<TColumns>>(query1: RetrievalQuery<TColumns, TSingleColumn>, ...queries: RetrievalQuery<any, any>[])
	: RetrievalQuery<TColumns, TSingleColumn> {

	return queries.reduce((p, c) => new UnionQuery(p, c, true), query1);
}