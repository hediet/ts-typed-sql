import { FromItem, HardRow } from "../FromFactor";
import { Query } from "./Query";
import { MapExpressionOrInputValue, Expression, and, toCondition } from "../Expressions";
import { Constructable } from "./Common";
import { BooleanType } from "../Types";

class WhereMixin<TFromTblCols extends HardRow> {
	// #region define-macro whereMixin(TFromTblCols)
	protected _whereCondition: Expression<BooleanType> | undefined;
	protected lastFromItem: FromItem<TFromTblCols> | undefined;

	/**
	* Adds where conditions.
	* @param obj The object that defines equals expressions.
	*/
	public where(obj: Partial<MapExpressionOrInputValue<TFromTblCols>>): this;
	/**
	* Adds where conditions.
	* @param conditions The condition expressions.
	*/
	public where(...conditions: Expression<BooleanType>[]): this;
	public where(...args: any[]): this {
		const expression = toCondition(this.lastFromItem, args);
		this._whereCondition = and(this._whereCondition, expression);
		return this;
	}

	/**
	* Adds negated where conditions.
	*/
	public whereNot(condition: Expression<BooleanType>, ...conditions: Expression<BooleanType>[]): this {
		this._whereCondition = and(this._whereCondition, condition.not(), ...conditions.map(c => c.not()));
		return this;
	}

	// #endregion
}