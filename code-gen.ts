generateSelect("returning", "TReturningColumns", "TSingleColumn", "TTableColumns",	args => `InsertQuery<TTableColumns, ${args.selCols}, ${args.singleSelCol}>`);
generateSelect("returning", "TReturningColumns", "TSingleColumn", "TFromTblCols",	args => `UpdateQuery<TUpdatedColumns, ${args.selCols}, TFromTblCols, ${args.singleSelCol}>`);
generateSelect("returning", "TReturningColumns", "TSingleColumn", "TColumns",		args => `DeleteQuery<TColumns, ${args.selCols}, ${args.singleSelCol}>`);
generateSelect("select",	"TSelectedCols",	 "TSingleColumn", "TFromTblCols",	args => `SelectQuery<${args.selCols}, TFromTblCols, ${args.singleSelCol}>`);

function generateSelect(functionName: string, selColsName: string, singleSelColName: string, fromTblCols: string, typeName: (args: { selCols: string, singleSelCol: string }) => void): string {

	let result = "";

	result += `/** Selects all columns from the given table. */\n`;
	result += `public ${functionName}<T extends ImplicitColumns>(table: AllExpression<T>)`;
	result += ": " + typeName({ selCols: `Simplify<${selColsName} & {[TName in keyof T]: T[TName]}>`, singleSelCol: "MoreThanOneColumnSelected" }) + ";";
	result += "\n\n";

	const noColumnsSelectedType = typeName({ selCols: selColsName, singleSelCol: "NoColumnsSelected" });

	result += `/** Selects a single named expression. */\n`;
	result += `public ${functionName}<T1 extends NmdExpr>(this: ${noColumnsSelectedType} | void, expr1: T1)`;
	result += ": " + typeName({ selCols: `Simplify<${selColsName} & NmdExprToImplctColumn<T1>>`, singleSelCol: "NamedExpressionNameOf<T1>" }) + ";";
	result += "\n\n";

	for (let j = 1; j <= 8; j++) {
		const a = Array.apply(null, { length: j }).map(Number.call, Number).map(i => i + 1);
		result += `/** Selects ${j} named expressions. */\n`;
		result += `public ${functionName}<${a.map(i => `T${i} extends NmdExpr`).join(", ")}>(${a.map(i => `expr${i}: T${i}`).join(", ")})`;
		result += ": " + typeName({ selCols: `Simplify<${selColsName} & ${a.map(i => `NmdExprToImplctColumn<T${i}>`).join(" & ")}>`, singleSelCol: "MoreThanOneColumnSelected" }) + ";";
		result += "\n\n";
	}

	result += "/** Selects a single column that is currently in scope. */\n";
	result += `public ${functionName}<TColumnName extends keyof ${fromTblCols}>(this: ${noColumnsSelectedType}, column1: TColumnName)`;
	result += ": " + typeName({ selCols: `Simplify<${selColsName} & { [TName in TColumnName]: ${fromTblCols}[TName]}>`, singleSelCol: "TColumnName" }) + ";";
	result += "\n\n";

	result += "/** Selects columns that are currently in scope. */\n";
	result += `public ${functionName}<TColumnNames extends keyof ${fromTblCols}>(...columns: TColumnNames[])`;
	result += ": " + typeName({ selCols: `Simplify<${selColsName} & { [TName in TColumnNames]: ${fromTblCols}[TName]}>`, singleSelCol: "MoreThanOneColumnSelected" }) + ";";

	console.log(result);
	return result;
}
