export class ColumnDescription<T> {
	_type: T;
}

export type TypeOfColumnDescription<T extends ColumnDescription<any>> = T["_type"];

export const string = new ColumnDescription<string>();
export const number = new ColumnDescription<number>();

export function column<T>(): ColumnDescription<T> {
	return new ColumnDescription<T>();
}
