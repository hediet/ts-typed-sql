import { Row, FromItem, RowToColumns, ColumnsToRow } from "./FromFactor";
import { TableColumn } from "./Expressions";
import { toObject, combine, objectEntries } from "../Helpers";
import { AnyType } from "./Types";

export interface TableName {
	schema?: string,
	name: string
}

export class Table<TRequiredColumns extends Row, TOptionalColumns extends Row>
			extends FromItem<TRequiredColumns & TOptionalColumns> {
	public $requiredColumns: RowToColumns<TRequiredColumns>;
	public $optionalColumns: RowToColumns<TOptionalColumns>;

	constructor(public readonly $name: TableName, requiredColumns: RowToColumns<TRequiredColumns>, 
			optionalColumns: RowToColumns<TOptionalColumns>) {
		super(combine(requiredColumns, optionalColumns), false);

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

export type TableRequiredColumns<TTable extends Table<any, any>> = ColumnsToRow<TTable["$requiredColumns"]>;
export type TableOptionalColumns<TTable extends Table<any, any>> = ColumnsToRow<TTable["$optionalColumns"]>;

export type TableCtor<TRequiredColumns extends Row, TOptionalColumns extends Row> 
	= Table<TRequiredColumns, TOptionalColumns> & RowToColumns<TRequiredColumns & TOptionalColumns>;

export interface RowDescription { [columnName: string]: AnyType };

export type RowDescriptionToRow<TColumns extends RowDescription> = TColumns;

/**
 * Declares a table.
 * @param tableName The name of the table.
 * @param requiredColumns Columns that need a value when inserting new rows.
 */
export function table<
		TColumnsWithTypes1 extends RowDescription>(
			tableName: string | TableName,
			requiredColumns: TColumnsWithTypes1,
		): TableCtor<RowDescriptionToRow<TColumnsWithTypes1>, {}>;
/**
 * Declares a table.
 * @param tableName The name of the table.
 * @param requiredColumns Columns that need a value when inserting new rows.
 * @param optionalColumns Columns that don't need a value when inserting new rows.
 */
export function table<
		TColumnsWithTypes1 extends RowDescription,
		TColumnsWithTypes2 extends RowDescription>(
			tableName: string | TableName,
			requiredColumns: TColumnsWithTypes1,
			optionalColumns: TColumnsWithTypes2
		):
	TableCtor<RowDescriptionToRow<TColumnsWithTypes1>, RowDescriptionToRow<TColumnsWithTypes2>>;
export function table(tableName: string | TableName, requiredColumns: RowDescription, optionalColumns: RowDescription = {}) {
	
	const setters: ((fromItem: FromItem<any>) => void)[] = [];
	const toTableColumn = (name: string, columnType: AnyType) => {
		if (!columnType) throw new Error(`Column '${name}' has no type.`);
		return new TableColumn(name, columnType, setter => setters.push(setter));
	};

	const reqColumns = toObject(objectEntries(requiredColumns)
		.map(([name, columnType]) => toTableColumn(name, columnType)), i => i.name);
		
	const optColumns = toObject(objectEntries(optionalColumns)
		.map(([name, columnType]) => toTableColumn(name, columnType)), i => i.name);
	
	const tblName = (typeof tableName === "string") ? { name: tableName, schema: undefined } : tableName;

	const table = new Table(tblName, reqColumns, optColumns);
	for (const setter of setters)
		setter(table);

	return table;
}
