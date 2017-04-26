import { Expression, ExpressionOrValue, ExpressionTypeOf, toCondition, MapExpressionOrValue } from "../Expressions";
import { FromItem, FromFactor, FromFactorFullJoin, FromFactorInnerJoin, FromFactorLeftJoin } from "../FromFactor";
import { Constructable } from "./Common";

type FromItemToImplicitColumns<TFromItem extends FromItem<any>> =
	{ [TName in keyof TFromItem["$columns"] ]: ExpressionTypeOf<TFromItem["$columns"][TName]> } ;

export function JoinMixin<BC extends Constructable<object>>(Base: BC) {
	return class JoinMixin extends Base {
		protected _from: FromFactor | undefined = undefined;

		private curriedOnJoin(ctor: new (fromFactor: FromFactor, joined: FromFactor, condition: Expression<boolean>) => FromFactor) {
			return (joined: FromItem<any>, condition: Expression<boolean>): this => {
				if (!this._from) throw new Error("A primary table must be selected before other tables can be joined.");
				this._from = new ctor(this._from, joined, condition);
				return this;
			}
		}

		/**
		 * Performs a join on the current query (`cur`) and a specified table (`joined`).
		 * These rows are returned for all join types:
		 * ```
		 * for (row r in cur): for (row j in joined that matches r)
		 * 	yield row(r, j)
		 * ```
		 * These rows are returned in addition, if it is a **full** or **left** join:
		 * ```
		 * for (row r in cur): if (joined has no row that matches r)
		 * 	yield row(r, null)
		 * ```
		 * These rows are returned in addition, if it is a **full** join:
		 * ```
		 * for (row j in joined): if (cur has no row that matches j)
		 * 	yield row(null, j)
		 * ```
		 */
		public fullJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
			return new JoinConditionBuilder(fromItem, this.curriedOnJoin(FromFactorFullJoin));
		}

		public innerJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
			return new JoinConditionBuilder(fromItem, this.curriedOnJoin(FromFactorInnerJoin));
		}

		public leftJoin<TFromItemColumns>(fromItem: FromItem<TFromItemColumns>): JoinConditionBuilder<TFromItemColumns, this> {
			return new JoinConditionBuilder(fromItem, this.curriedOnJoin(FromFactorLeftJoin));
		}
	};
}

export class JoinConditionBuilder<TFromItemColumns, TReturn> {
	constructor(private readonly fromItem: FromItem<any>, private readonly onJoin: (joined: FromItem<any>, condition: Expression<boolean>) => TReturn) {}
	public on(condition: Expression<boolean>, ...furtherConditions: Expression<boolean>[]): TReturn;
	public on(condition: Partial<MapExpressionOrValue<TFromItemColumns>>): TReturn;
	public on(...conditions: any[]): TReturn {
		const condition = toCondition(this.fromItem, conditions);
		if (!condition) throw new Error("No condition for joined was given.");
		return this.onJoin(this.fromItem, condition);
	}
}