import { FromItem } from "../FromFactor";
import { Query } from "./Query";
import { MapExpressionOrValue, Expression, and, toCondition } from "../Expressions";
import { Constructable } from "./Common";


export function WhereMixin<BC extends Constructable<object>, TFromTblCols>(Base: BC) {
	return class WhereMixin extends Base {
		protected _whereCondition: Expression<boolean> | undefined;
		protected lastFromItem: FromItem<TFromTblCols> | undefined;

		public where(obj: Partial<MapExpressionOrValue<TFromTblCols>>): this;
		public where(...conditions: Expression<boolean>[]): this;
		public where(...args: any[]): this {
			const expression = toCondition(this.lastFromItem, args);
			this._whereCondition = and(this._whereCondition, expression);
			return this;
		}

		public whereNot(condition: Expression<boolean>, ...conditions: Expression<boolean>[]): this {
			this._whereCondition = and(condition.not(), ...conditions.map(c => c.not()));
			return this;
		}
	};
}
