import { SqlGenerator, Context, ExpressionContext } from "../SqlGenerator";
import { ValueExpression } from "../AST/Expressions";

export class PostgreSqlGenerator extends SqlGenerator {
	protected quoteSchemaOrTableOrColumnName(name: string): string {
		if (this.options.skipQuotingIfNotRequired && /^[a-z_][a-z_0-9]*$/.test(name))
			return name;
		return this.escapeIdentifier(name);
	}

	protected escapeValue(expr: ValueExpression<any>, context: ExpressionContext): string {
		const val = expr.value;

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