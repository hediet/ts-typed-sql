import { BooleanType } from '../Types';
import { Expression, ExpressionOrInputValue, ExpressionTypeOf, toCondition, MapExpressionOrInputValue } from "../Expressions";
import { FromItem, FromFactor, FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin } from "../FromFactor";
import { Constructable } from "./Common";

export interface JoinMixinInstance {
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
	fullJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this>;

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
	leftJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this>;

	/**
	 * Performs an inner join on the current query (`cur`) and a specified table (`joined`).
	 * These rows are returned:
	 * ```
	 * for (row r in cur): for (row j in joined that matches r)
	 * 	yield row(r, j)
	 * ```
	 */
	innerJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this>;
}

export function JoinMixin<BC extends Constructable<object>>(Base: BC): Constructable<JoinMixinInstance> & BC {
	return class extends Base {
		protected _from: FromFactor | undefined = undefined;

		private curriedOnJoin(ctor: new (fromFactor: FromFactor, joined: FromFactor, condition: Expression<BooleanType>) => FromFactor) {
			return (joined: FromItem<any>, condition: Expression<BooleanType>): this => {
				if (!this._from) throw new Error("A primary table must be selected before other tables can be joined.");
				this._from = new ctor(this._from, joined, condition);
				return this;
			}
		}

		public fullJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
			return new JoinConditionBuilder(fromItem, this.curriedOnJoin(FromFactorFullJoin));
		}

		public leftJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
			return new JoinConditionBuilder(fromItem, this.curriedOnJoin(FromFactorLeftJoin));
		}

		public innerJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
			return new JoinConditionBuilder(fromItem, this.curriedOnJoin(FromFactorInnerJoin));
		}
	};
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