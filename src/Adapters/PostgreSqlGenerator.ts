import { SqlGenerator, Context, ExpressionContext } from "../SqlGenerator";
import { ValueExpression } from "../AST/Expressions";

export class PostgreSqlGenerator extends SqlGenerator {
	protected quoteSchemaOrTableOrColumnName(name: string): string {
		if (this.options.skipQuotingIfNotRequired && /^[a-z_]+$/.test(name))
			return name;
		return `"${name.replace('"', '""')}"`;
	}

	protected escapeValue(expr: ValueExpression<any>, context: ExpressionContext): string {
		const val = expr.value;

		if (expr.preferEscaping) {
			if (val === null) return "null";
			if (typeof val === "string") return `'${val}'`; // todo escape
			if (typeof val === "number") return val.toString();
			if (typeof val === "boolean") return val.toString();
			
			throw new Error(`Unsupported value: '${val}'.`);
		}

		context.context.parameters.push(val);
		const id = context.context.parameters.length;
		return `$${id}`;
	}
}