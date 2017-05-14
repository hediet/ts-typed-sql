import { FromItem, HardRow } from "../FromFactor";
import { Query } from "./Query";
import { MapExpressionOrInputValue, Expression, and, toCondition } from "../Expressions";
import { Constructable } from "./Common";
import { BooleanType } from "../Types";

export interface WhereMixinInstance<TFromTblCols> {
	/**
	 * Sets where conditions.
	 * @param obj The object that defines equals expressions.
	 */
	where(obj: Partial<MapExpressionOrInputValue<TFromTblCols>>): this;

	/**
	 * Sets where conditions.
	 * @param conditions The condition expressions.
	 */
	where(...conditions: Expression<BooleanType>[]): this;

	/**
	 * Sets negated where conditions.
	 */
	whereNot(condition: Expression<BooleanType>, ...conditions: Expression<BooleanType>[]): this;
}

export function WhereMixin<BC extends Constructable<object>, TFromTblCols extends HardRow>(Base: BC): Constructable<WhereMixinInstance<TFromTblCols>> & BC {
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
