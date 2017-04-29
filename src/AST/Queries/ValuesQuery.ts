import { MoreThanOneColumnSelected } from './Query';
import { ColumnDescription } from "../ColumnDescription";
import { ColumnsWithTypesToImplicit } from "../Table";
import { FromItemCtor, QueryFromItem, FromItem } from "../FromFactor";
import { RetrievalQuery } from "./RetrievalQuery";
import { AsColumn } from "../Expressions";
import { toObject } from "../../Helpers";

export function values<T extends { [columnName: string]: any }>(items: T[]): ValuesQuery<T> {
	return new ValuesQuery<T>(items);
}

export class ValuesQuery<TAsColumns> extends RetrievalQuery<{}, MoreThanOneColumnSelected> {
	constructor(public readonly values: TAsColumns[]) { super(); }

	public as(name: string): FromItemCtor<TAsColumns> {
		const setters: ((fromItem: FromItem<any>) => void)[] = [];
		const first = this.values[0];
		const columns = toObject(Object.keys(first), s => s, s => new ColumnDescription());

		return super.as(name, columns);
	}
}