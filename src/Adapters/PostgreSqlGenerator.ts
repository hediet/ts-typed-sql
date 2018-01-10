import { SqlGenerator, Context, ExpressionContext } from "../SqlGenerator";
import { ValueExpression } from "../AST/Expressions";
import { AnyType } from "../index";

export class PostgreSqlGenerator extends SqlGenerator {
	protected quoteSchemaOrTableOrColumnName(name: string): string {
		if (this.options.skipQuotingIfNotRequired && /^[a-z_][a-z_0-9]*$/.test(name) && pgLowercaseKeywords.indexOf(name.toLowerCase()) === -1)
			return name;
		return this.escapeIdentifier(name);
	}

	protected escapeValue(expr: ValueExpression<AnyType>, context: ExpressionContext): string {
		const val = expr.type.serialize(expr.value);

		if (expr.preferEscaping) {
			if (val === null) return "null";
			if (typeof val === "string") return this.escapeLiteral(val);
			if (typeof val === "number") return val.toString();
			if (typeof val === "boolean") return val.toString();
			
			throw new Error(`Unsupported value: '${val}'.`);
		}
		else {
			context.context.parameters.push(val);
			const id = context.context.parameters.length;
			return `$${id}`;
		}
	}


	// https://github.com/brianc/node-postgres/blob/f42924bf057943d5a79ff02c4d35b18777dc5754/lib/client.js#L261
	private escapeIdentifier(str: string) {
		let escaped = '"';

		for (let i = 0; i < str.length; i++) {
			const c = str[i];
			if (c === '"') {
				escaped += c + c;
			} else {
				escaped += c;
			}
		}

		escaped += '"';
		return escaped;
	}

	// https://github.com/brianc/node-postgres/blob/f42924bf057943d5a79ff02c4d35b18777dc5754/lib/client.js#L280
	private escapeLiteral(str: string) {
		let hasBackslash = false;
		let escaped = '\'';

		for(let i = 0; i < str.length; i++) {
			const c = str[i];
			if(c === '\'') {
				escaped += c + c;
			} else if (c === '\\') {
				escaped += c + c;
				hasBackslash = true;
			} else {
				escaped += c;
			}
		}

		escaped += '\'';

		if(hasBackslash === true) {
			escaped = ' E' + escaped;
		}

		return escaped;
	}
}

const pgLowercaseKeywords = [
	"all",
	"analyse",
	"analyze",
	"and",
	"any",
	"array",
	"as",
	"asc",
	"asymmetric",
	"authorization",
	"between",
	"bigint",
	"binary",
	"bit",
	"boolean",
	"both",
	"case",
	"cast",
	"char",
	"character",
	"check",
	"coalesce",
	"collate",
	"collation",
	"column",
	"concurrently",
	"constraint",
	"create",
	"cross",
	"current_catalog",
	"current_date",
	"current_role",
	"current_schema",
	"current_time",
	"current_timestamp",
	"current_user",
	"dec",
	"decimal",
	"default",
	"deferrable",
	"desc",
	"distinct",
	"do",
	"else",
	"end",
	"except",
	"exists",
	"extract",
	"false",
	"fetch",
	"float",
	"for",
	"foreign",
	"freeze",
	"from",
	"full",
	"grant",
	"greatest",
	"group",
	"grouping",
	"having",
	"ilike",
	"in",
	"initially",
	"inner",
	"inout",
	"int",
	"integer",
	"intersect",
	"interval",
	"into",
	"is",
	"isnull",
	"join",
	"lateral",
	"leading",
	"least",
	"left",
	"like",
	"limit",
	"localtime",
	"localtimestamp",
	"national",
	"natural",
	"nchar",
	"none",
	"not",
	"notnull",
	"null",
	"nullif",
	"numeric",
	"offset",
	"on",
	"only",
	"or",
	"order",
	"out",
	"outer",
	"overlaps",
	"overlay",
	"placing",
	"position",
	"precision",
	"primary",
	"real",
	"references",
	"returning",
	"right",
	"row",
	"select",
	"session_user",
	"setof",
	"similar",
	"smallint",
	"some",
	"substring",
	"symmetric",
	"table",
	"tablesample",
	"then",
	"time",
	"timestamp",
	"to",
	"trailing",
	"treat",
	"trim",
	"true",
	"union",
	"unique",
	"user",
	"using",
	"values",
	"varchar",
	"variadic",
	"verbose",
	"when",
	"where",
	"window",
	"with",
	"xmlattributes",
	"xmlconcat",
	"xmlelement",
	"xmlexists",
	"xmlforest",
	"xmlparse",
	"xmlpi",
	"xmlroot",
	"xmlserialize"
];