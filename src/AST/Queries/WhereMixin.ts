import { FromItem } from "../FromFactor";
import { Query } from "./Query";
import { MapExpressionOrInputValue, Expression, and, toCondition } from "../Expressions";
import { Constructable } from "./Common";
import { BooleanType } from "../Types";

export interface WhereMixinInstance<TFromTblCols> {
	where(obj: Partial<MapExpressionOrInputValue<TFromTblCols>>): this;
	where(...conditions: Expression<BooleanType>[]): this;
	whereNot(condition: Expression<BooleanType>, ...conditions: Expression<BooleanType>[]): this;
}

export function WhereMixin<BC extends Constructable<object>, TFromTblCols>(Base: BC): Constructable<WhereMixinInstance<TFromTblCols>> & BC {
	return class extends Base {
		protected _whereCondition: Expression<BooleanType> | undefined;
		protected lastFromItem: FromItem<TFromTblCols> | undefined;

		public where(obj: Partial<MapExpressionOrInputValue<TFromTblCols>>): this;
		public where(...conditions: Expression<BooleanType>[]): this;
		public where(...args: any[]): this {
			const expression = toCondition(this.lastFromItem, args);
			this._whereCondition = and(this._whereCondition, expression);
			return this;
		}

		public whereNot(condition: Expression<BooleanType>, ...conditions: Expression<BooleanType>[]): this {
			this._whereCondition = and(condition.not(), ...conditions.map(c => c.not()));
			return this;
		}
	};
}
