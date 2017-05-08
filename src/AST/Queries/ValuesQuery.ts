import { AnyType, tVoid, GetInType } from '../Types';
import { MoreThanOneColumnSelected } from './Query';
import { RowDescriptionToRow } from "../Table";
import { FromItemCtor, QueryFromItem, FromItem } from "../FromFactor";
import { RetrievalQuery } from "./RetrievalQuery";
import { AsColumn } from "../Expressions";
import { toObject, objectEntries } from "../../Helpers";

export function values<T extends { [columnName: string]: AnyType }>(columns: T, items?: { [TName in keyof T]: GetInType<T[TName]> }[]): ValuesQuery<T> {
	const values = new ValuesQuery<T>(columns);
	if (items)
		values.withValues(items);
	return values;
}

export class ValuesQuery<TAsColumns extends { [columnName: string]: AnyType }> extends RetrievalQuery<{}, MoreThanOneColumnSelected> {
	public readonly values: { [TName in keyof TAsColumns]: GetInType<TAsColumns[TName]> }[] = [];

	constructor(public readonly columns: TAsColumns) {
		super();
	}

	public withValues(items: { [TName in keyof TAsColumns]: GetInType<TAsColumns[TName]> }[]): this {
		this.values.push(...items);
		return this;
	}

	public as(name: string): FromItemCtor<TAsColumns> {
		const setters: ((fromItem: FromItem<any>) => void)[] = [];
		const first = this.values[0];
		const columns = toObject(objectEntries(this.columns), ([name]) => name, ([name, type]) => type);

		return super.as(name, columns);
	}
}