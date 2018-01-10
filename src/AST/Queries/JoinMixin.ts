import { BooleanType } from '../Types';
import { Expression, ExpressionOrInputValue, ExpressionTypeOf, toCondition, MapExpressionOrInputValue } from "../Expressions";
import { FromItem, FromFactor, FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin, HardRow } from "../FromFactor";
import { Constructable } from "./Common";

class JoinMixin {
	// #region define-macro joinMixin()
	protected _from: FromFactor | undefined = undefined;

	/**
	* Performs a full join on the current query (`cur`) and a specified table (`joined`).
	* These rows are returned:
	* ```
	* for (row r in cur): for (row j in joined that matches r)
	* 	yield row(r, j)
	* for (row r in cur): if (joined has no row that matches r)
	* 	yield row(r, null)
	* for (row j in joined): if (cur has no row that matches j)
	* 	yield row(null, j)
	* ```
	*/
	public fullJoin<TFromItemColumns extends HardRow>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
		return doJoin(this, this._from, newFrom => this._from = newFrom, FromFactorFullJoin, fromItem);
	}

	/**
	* Performs a left join on the current query (`cur`) and a specified table (`joined`).
	* These rows are returned:
	* ```
	* for (row r in cur): for (row j in joined that matches r)
	* 	yield row(r, j)
	* for (row r in cur): if (joined has no row that matches r)
	* 	yield row(r, null)
	* ```
	*/
	public leftJoin<TFromItemColumns extends HardRow>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
		return doJoin(this, this._from, newFrom => this._from = newFrom, FromFactorLeftJoin, fromItem);
	}

	/**
	* Performs an inner join on the current query (`cur`) and a specified table (`joined`).
	* These rows are returned:
	* ```
	* for (row r in cur): for (row j in joined that matches r)
	* 	yield row(r, j)
	* ```
	*/
	public innerJoin<TFromItemColumns extends HardRow>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
		return doJoin(this, this._from, newFrom => this._from = newFrom, FromFactorInnerJoin, fromItem);
	}
	// #endregion
}

export type FromFactorCtor = new (from: FromFactor, joined: FromFactor, condition: Expression<BooleanType>) => FromFactor;

export function doJoin<TFromItemColumns, TSelf>(self: TSelf, currentFrom: FromFactor | undefined, fromUpdater: (newFrom: FromFactor) => void, ctor: FromFactorCtor, fromItem: FromItem<any>) {
	return new JoinConditionBuilder(fromItem, (joined: FromItem<any>, condition: Expression<BooleanType>): TSelf => {
		if (!currentFrom) throw new Error("A primary table must be selected before other tables can be joined.");
		fromUpdater(new ctor(currentFrom, joined, condition));
		return self;
	});
}

export class JoinConditionBuilder<TFromItemColumns, TReturn> {
	constructor(private readonly fromItem: FromItem<any>, private readonly onJoin: (joined: FromItem<any>, condition: Expression<BooleanType>) => TReturn) { }

	/**
	 * Specifies the condition of the join.
	 * At least one condition must be set.
	 * 
	 * @param condition The condition.
	 * @param furtherConditions More conditions.
	 */
	public on(condition: Expression<BooleanType>, ...furtherConditions: Expression<BooleanType>[]): TReturn;
	/**
	 * Specifies the condition of the join.
	 * At least one property must be set.
	 * 
	 * @param condition An object that represents multiple equals conditions.
	 *	Each property refers to a column of the joined table, its value to the expression the column must be equal to.
	 */
	public on(condition: Partial<MapExpressionOrInputValue<TFromItemColumns>>): TReturn;
	public on(...conditions: any[]): TReturn {
		const condition = toCondition(this.fromItem, conditions);
		if (!condition) throw new Error("No condition for joined was given.");
		return this.onJoin(this.fromItem, condition);
	}
}