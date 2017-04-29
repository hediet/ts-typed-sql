import { ColumnDescription, TypeOfColumnDescription } from "./ColumnDescription";
import { ImplicitColumns, FromItem, ImplicitColumnsToColumns, ColumnsToImplicit } from "./FromFactor";
import { TableColumn } from "./Expressions";
import { toObject } from "../Helpers";

export interface TableName {
	schema: string|undefined,
	name: string
}

export class Table<TRequiredColumns extends ImplicitColumns, TOptionalColumns extends ImplicitColumns>
			extends FromItem<TRequiredColumns & TOptionalColumns> {
	private $requiredColumns: ImplicitColumnsToColumns<TRequiredColumns>;
	private $optionalColumns: ImplicitColumnsToColumns<TOptionalColumns>;

	constructor(public readonly $name: TableName, requiredColumns: ImplicitColumnsToColumns<TRequiredColumns>, 
			optionalColumns: ImplicitColumnsToColumns<TOptionalColumns>) {
		super(Object.assign({}, requiredColumns, optionalColumns), false);

		this.$requiredColumns = requiredColumns;
		this.$optionalColumns = optionalColumns;
	}

	public toString() {
		let str = "";
		if (this.$name.schema)
			str = `${this.$name.schema}.`
		str += this.$name.name;
		return str;
	}
}

export type TableRequiredColumns<TTable extends any> = ColumnsToImplicit<TTable["$requiredColumns"]>;
export type TableOptionalColumns<TTable extends any> = ColumnsToImplicit<TTable["$optionalColumns"]>;

export type TableCtor<TRequiredColumns extends ImplicitColumns, TOptionalColumns extends ImplicitColumns> 
	= Table<TRequiredColumns, TOptionalColumns> & ImplicitColumnsToColumns<TRequiredColumns & TOptionalColumns>;

export interface ColumnDescriptions { [columnName: string]: ColumnDescription<any> }

export type ColumnsWithTypesToImplicit<TColumns extends ColumnDescriptions>
	= { [TName in keyof TColumns]: TypeOfColumnDescription<TColumns[TName]> };

export function table<
		TColumnsWithTypes1 extends ColumnDescriptions>(
			tableName: string | TableName,
			requiredColumns: TColumnsWithTypes1,
		): TableCtor<ColumnsWithTypesToImplicit<TColumnsWithTypes1>, {}>;
export function table<
		TColumnsWithTypes1 extends ColumnDescriptions,
		TColumnsWithTypes2 extends ColumnDescriptions>(
			tableName: string | TableName,
			requiredColumns: TColumnsWithTypes1,
			optionalColumns: TColumnsWithTypes2
		):
	TableCtor<ColumnsWithTypesToImplicit<TColumnsWithTypes1>, ColumnsWithTypesToImplicit<TColumnsWithTypes2>>;
export function table(tableName: string | TableName, requiredColumns: {}, optionalColumns: {} = {}) {
	
	const setters: ((fromItem: FromItem<any>) => void)[] = [];
	const reqColumns = toObject(Object.entries(requiredColumns)
		.map(([name, columnDescription]) => new TableColumn(name, setter => setters.push(setter))), i => i.name);
	const optColumns = toObject(Object.entries(optionalColumns)
		.map(([name, columnDescription]) => new TableColumn(name, setter => setters.push(setter))), i => i.name);
	
	const tblName = (typeof tableName === "string") ? { name: tableName, schema: undefined } : tableName;

	const table = new Table(tblName, reqColumns, optColumns);
	for (const setter of setters)
		setter(table);

	return table;
}
