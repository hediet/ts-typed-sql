import {
	select, from, table, column, DbConnection, insertInto,
	update, val, defaultValue, SqlGenerator, PostgreQueryService, concat, not, deleteFrom, Query, PostgreSqlGenerator, values
} from "../src/index";

const contacts = table("contacts",
	{
		firstname: column<"1" | "3">(),
		lastname: column<"2" | "4">(),
		parentFirstname: column<"3">(),
		parentLastname: column<"4">()
	},
	{
		id: column<number>()
	});

function check<T2>(query: Query<T2>, expectedSql: string, args: any[] = []) {
	const generator = new PostgreSqlGenerator({ shortenColumnNameIfUnambigous: true, skipQuotingIfNotRequired: true });
	const sql = generator.toSql(query);

	if (sql.sql !== expectedSql) throw new Error();
}

describe("Select", () => {
	it("should support basic select statements", () => {
		check<{}>(
			from(contacts),
			`SELECT FROM contacts`
		);

		check<{ firstname: "1" | "3", lastname: "2" | "4", parentFirstname: "3", parentLastname: "4" }>(
			select(contacts.$all).from(contacts),
			`SELECT contacts.* FROM contacts`
		);

		check<{ firstname: "1" | "3", lastname: "2" | "4", parentFirstname: "3", parentLastname: "4" }>(
			from(contacts).select(contacts.$all),
			`SELECT contacts.* FROM contacts`
		);

		check<{ fn: "1" | "3" }>(
			select(contacts.firstname.as("fn")).from(contacts),
			`SELECT firstname AS fn FROM contacts`
		);

		check<{ fn: "1" | "3", ln: "2" | "4" }>(
			select(contacts.firstname.as("fn")).select(contacts.lastname.as("ln")).from(contacts),
			`SELECT firstname AS fn, lastname AS ln FROM contacts`
		);

		check<{ fn: "1" | "3", ln: "2" | "4" }>(
			select(contacts.firstname.as("fn"), contacts.lastname.as("ln")).from(contacts),
			`SELECT firstname AS fn, lastname AS ln FROM contacts`
		);
	});
});

describe("Values", () => {
	it("should support values", () => {
		const vals = values([{ a: 1, b: 2 }, { a: 1, b: 3 }]).as("v");
		check(
			from(vals).select(vals.a, vals.b),
			`SELECT v.a, v.b FROM (VALUES (1, 2), (1, 3)) AS v(a, b)`
		);
	});
})
