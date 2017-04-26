import { Query } from "./Query";
import { Expression, ExpressionOrValue, RetrievalQueryAsExpression, Variable, normalize, AllExpression, NamedExpression } from "../Expressions";
import { FromItem } from "../FromFactor";

export interface NoColumnsSelected { _brand: "NoColumnSelected" }
export interface MoreThanOneColumnSelected { _brand: "MoreThanOneColumnSelected" }
export type SingleColumn<TSelectedCols> = NoColumnsSelected|(keyof TSelectedCols)|MoreThanOneColumnSelected;

export class RetrievalQuery<TColumns, TSingleColumn extends SingleColumn<TColumns>> extends Query<TColumns> {
	private _limit: Expression<number> | undefined;
	private _offset: Expression<number> | undefined;

	public getState() {
		return Object.assign({
			limit: this._limit,
			offset: this._offset
		}, super.getState());
	}

	public limit(count: ExpressionOrValue<number>): this {
		this._limit = normalize(count);
		return this;
	}

	public offset(count: ExpressionOrValue<number>): this {
		this._offset = normalize(count);
		return this;
	}

	public asExpression<TSingleColumn2 extends keyof TColumns>
		(this: RetrievalQuery<TColumns, TSingleColumn2>): Expression<TColumns[TSingleColumn2]> {
		return new RetrievalQueryAsExpression<TColumns[TSingleColumn2]>(this);
	}

	public readonly singleColumn: TSingleColumn;
}

export class UnionQuery<TColumns, TSingleColumn extends SingleColumn<TColumns>> extends RetrievalQuery<TColumns, TSingleColumn> {

}

export function unionAll<TColumns, TSingleColumn extends SingleColumn<TColumns>>(query1: RetrievalQuery<TColumns, TSingleColumn>, ...queries: RetrievalQuery<any, any>[])
	: UnionQuery<TColumns, TSingleColumn> {

}