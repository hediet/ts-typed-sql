import {
	select, from, table, column, DbConnection, insertInto,
	update, val, defaultValue, SqlGenerator, PostgreQueryService, concat, not, deleteFrom, Query, PostgreSqlGenerator, values, Expression
} from "../src/index";
import * as assert from "assert";

const contacts = table("contacts",
	{
		firstname: column<"1" | "3">(),
		lastname: column<"2" | "4">(),
		parentFirstname: column<"3">(),
		parentLastname: column<"4">()
	},
	{
		id: column<number>()
	}
);

const contactAddresses = table("contact_addresses",
	{
		id: column<number>(),
		address: column<string>()
	}
);

function check<T2>(query: Query<T2, any>, expectedSql: string, args: any[] = []) {
	const generator = new PostgreSqlGenerator({ shortenColumnNameIfUnambigous: true, skipQuotingIfNotRequired: true });
	const sql = generator.toSql(query);

	assert.equal(sql.sql, expectedSql);
	assert.deepEqual(sql.parameters, args);
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

	it("should support complex selections", () => {
		check(
			select(select(val(1).as("foo")).asExpression().as("bla")),
			`SELECT (SELECT $1 AS foo) AS bla`, [1]
		);
	});

	it("should throw on invalid argument", () => {
		assert.throws(() => {
			select("test" as any);
		});

		assert.throws(() => {
			from(contacts).select("test" as any);
		});

		assert.throws(() => {
			from(contacts).select([] as any);
		});
	});

	describe("Joins", () => {
		const c = contacts.as("c").asNullable();

		it("should support LEFT JOIN", () => {
			check(
				from(contacts).leftJoin(c).on({ firstname: contacts.parentFirstname, lastname: contacts.parentLastname }),
				`SELECT FROM contacts LEFT JOIN contacts AS c ON c.firstname = contacts."parentFirstname" AND c.lastname = contacts."parentLastname"`
			);
		});

		it("should support FULL JOIN", () => {
			check(
				from(contacts).fullJoin(c).on({ firstname: contacts.parentFirstname, lastname: contacts.parentLastname }),
				`SELECT FROM contacts FULL JOIN contacts AS c ON c.firstname = contacts."parentFirstname" AND c.lastname = contacts."parentLastname"`
			);
		});

		it("should support INNER JOIN", () => {
			check(
				from(contacts).innerJoin(c).on({ firstname: contacts.parentFirstname, lastname: contacts.parentLastname }),
				`SELECT FROM contacts JOIN contacts AS c ON c.firstname = contacts."parentFirstname" AND c.lastname = contacts."parentLastname"`
			);
		});

		it("should support CROSS JOIN", () => {
			check(
				from(contacts).from(c),
				`SELECT FROM contacts CROSS JOIN contacts AS c`
			);
		});

		it("should require a JOIN condition", () => {
			assert.throws(() => {
				from(contacts).leftJoin(c).on({})
			});
		});

		it("should require a from before join", () => {
			assert.throws(() => {
				select().leftJoin(c).on({})
			}, "A primary table must be selected before other tables can be joined.");
		});
	})




	describe("Limit, Offset", () => {
		it("should support limit and offset", () => {
			check(
				from(contacts).limit(1).offset(10),
				`SELECT FROM contacts LIMIT $1 OFFSET $2`, [1, 10]
			);

			check(
				from(contacts).offset(12).offset(10).limit(2).limit(1),
				`SELECT FROM contacts LIMIT $1 OFFSET $2`, [1, 10]
			);
		});
	});

	describe("Order By", () => {
		it("should support order by", () => {
			check(
				from(contacts).select(contacts.id).orderBy("id"),
				"SELECT id FROM contacts ORDER BY id"
			);

			check(
				from(contacts).select(contacts.firstname).orderBy({ asc: "id" }),
				"SELECT firstname FROM contacts ORDER BY id"
			);

			check(
				from(contacts).select(contacts.firstname).orderBy({ desc: "id" }),
				"SELECT firstname FROM contacts ORDER BY id DESC"
			);

			check(
				from(contacts).select(contacts.firstname).orderBy(contacts.id),
				"SELECT firstname FROM contacts ORDER BY id"
			);

			check(
				from(contacts).select(contacts.firstname).orderBy(contacts.id.asc()),
				"SELECT firstname FROM contacts ORDER BY id"
			);

			check(
				from(contacts).select(contacts.firstname).orderBy(contacts.id.desc()),
				"SELECT firstname FROM contacts ORDER BY id DESC"
			);

			check(
				from(contacts).select(concat(contacts.firstname, contacts.lastname).as("fullName")).orderBy(t => t.fullName),
				`SELECT CONCAT(firstname, lastname) AS "fullName" FROM contacts ORDER BY "fullName"`
			);

			check(
				from(contacts).select(concat(contacts.firstname, contacts.lastname).as("fullName")).orderBy(t => [ t.fullName ]),
				`SELECT CONCAT(firstname, lastname) AS "fullName" FROM contacts ORDER BY "fullName"`
			);
		})
	});

	describe("GroupBy, Having", () => {
		it("should support having", () => {
			check(
				from(contacts).select("lastname").groupBy("lastname").having(contacts.lastname.count().isGreaterThan(1)),
				"SELECT lastname FROM contacts GROUP BY lastname HAVING COUNT(lastname) > $1", [1]
			);
		});

		it("should support groupBy with reference to select", () => {
			check(
				from(contacts).select(contacts.lastname.as("f")).groupBy(c => c.f),
				"SELECT lastname AS f FROM contacts GROUP BY f"
			);

			check(
				from(contacts).select(contacts.lastname.as("f")).groupBy(c => [c.f]),
				"SELECT lastname AS f FROM contacts GROUP BY f"
			);
		});

		it("should support having with reference to select", () => {
			check(
				from(contacts).select("lastname").select(contacts.lastname.count().as("count")).groupBy("lastname").having(cols => cols.count.isGreaterThan(1)),
				"SELECT lastname, COUNT(lastname) AS count FROM contacts GROUP BY lastname HAVING COUNT(lastname) > $1", [1]
			);
		});
	});
});

describe("Where", () => {

	it("should support simple where", () => {
		check(
			from(contacts).where({ firstname: "1" }),
			`SELECT FROM contacts WHERE firstname = $1`, ["1"]
		);

		check(
			from(contacts).where({ firstname: "1", lastname: "4" }),
			`SELECT FROM contacts WHERE firstname = $1 AND lastname = $2`, ["1", "4"]
		);
	});

	it("should support where expressions", () => {
		check(
			from(contacts).where(contacts.firstname.isEqualTo("1"), contacts.lastname.isEqualTo("4")),
			`SELECT FROM contacts WHERE firstname = $1 AND lastname = $2`, ["1", "4"]
		);

		check(
			from(contacts).where(contacts.firstname.isEqualTo("1").and(contacts.lastname.isEqualTo("4"))),
			`SELECT FROM contacts WHERE firstname = $1 AND lastname = $2`, ["1", "4"]
		);
	});

	it("should support where not expressions", () => {
		check(
			from(contacts).whereNot(contacts.firstname.isEqualTo("1"), contacts.lastname.isEqualTo("4")),
			`SELECT FROM contacts WHERE NOT firstname = $1 AND NOT lastname = $2`, ["1", "4"]
		);

		check(
			from(contacts).whereNot(contacts.firstname.isEqualTo("1").and(contacts.lastname.isEqualTo("4"))),
			`SELECT FROM contacts WHERE NOT (firstname = $1 AND lastname = $2)`, ["1", "4"]
		);
	});
});

function checkExpression(expr: Expression<any>, expected: string, args: any[]) {
	check(select(expr.as("result")), `SELECT ${expected} AS result`, args);
}

describe("Expressions", () => {
	it("should support null operators", () => {
		checkExpression(
			val(1).isNull(),
			`$1 IS NULL`, [1]
		);

		checkExpression(
			val(1).isNotNull(),
			`$1 IS NOT NULL`, [1]
		);
	});

	it("should support in", () => {
		checkExpression(
			val(1).isIn([2, 3]),
			`$1 IN ($2, $3)`, [1, 2, 3]
		);
	});

	it("should support empty in", () => {
		checkExpression(
			val(1).isIn([]),
			`false`, []
		);
	});

	it("should support in query", () => {
		checkExpression(
			val(1).isInQuery(select(val(2).as("val"))),
			`$1 IN (SELECT $2 AS val)`, [1, 2]
		);
	});

	it("should support comparisons", () => {
		checkExpression(val(1).isAtLeast(2), `$1 >= $2`, [1, 2]);
		checkExpression(val(1).isGreaterThan(2), `$1 > $2`, [1, 2]);
		checkExpression(val(1).isAtMost(2), `$1 <= $2`, [1, 2]);
		checkExpression(val(1).isLessThan(2), `$1 < $2`, [1, 2]);

		checkExpression(val(1).isEqualTo(2), `$1 = $2`, [1, 2]);
		checkExpression(val(1).isNotEqualTo(2), `$1 != $2`, [1, 2]);
		checkExpression(val("str1").isLike("str%"), `$1 LIKE $2`, ["str1", "str%"]);
	});

	it("should support literal values", () => {
		checkExpression(val(null, true), `null`, []);
		checkExpression(val(true, true), `true`, []);
		checkExpression(val(1, true), `1`, []);
		checkExpression(val("1", true), `'1'`, []);
		checkExpression(val("1\\2", true), ` E'1\\\\2'`, []);
		checkExpression(val("'", true), `''''`, []);
	});
});

describe("Values", () => {
	it("should support values", () => {
		const vals = values([{ a: 1, b: 2 }, { a: 1, b: 3 }]).as("v");
		check(
			from(vals).select(vals.a, vals.b),
			`SELECT a, b FROM (VALUES ($1, $2), ($3, $4)) AS v(a, b)`, [ 1, 2, 1, 3 ]
		);
	});
});

describe("Update", () => {
	it("should support update", () => {
		check(
			update(contacts).set({ firstname: "1" }).where({ id: 0 }),
			`UPDATE contacts SET firstname = $1 WHERE id = $2`, ["1", 0]
		);

		check(
			update(contacts).set("firstname", "1").where({ id: 0 }),
			`UPDATE contacts SET firstname = $1 WHERE id = $2`, ["1", 0]
		);

		check(
			update(contacts).set("firstname", "1").where({ id: 0 }).returning("firstname"),
			`UPDATE contacts SET firstname = $1 WHERE id = $2 RETURNING firstname`, ["1", 0]
		);

		check(
			update(contacts)
				.from(contactAddresses)
				.where({ id: contacts.id })
				.where(contactAddresses.address.isLike("%NYC%"))
				.set({ firstname: "1" })
				.returning("id"),
			`UPDATE contacts SET firstname = $1 FROM contact_addresses WHERE contact_addresses.id = contacts.id AND (address LIKE $2) RETURNING contact_addresses.id`, ["1", "%NYC%"]
		);
	});
});

describe("Delete", () => {
	it("should support delete", () => {
		check(
			deleteFrom(contacts).where({ id: 0 }),
			`DELETE FROM contacts WHERE id = $1`, [0]
		);

		check(
			deleteFrom(contacts).where({ id: 0 }).returning("id"),
			`DELETE FROM contacts WHERE id = $1 RETURNING id`, [0]
		);
	});

	it("should support using", () => {
		const c = contacts.as("c");
		check(
			deleteFrom(contacts).using(c).where({ id: contacts.id }).returning("id"),
			`DELETE FROM contacts USING contacts AS c WHERE c.id = contacts.id RETURNING c.id`, []
		);
	});
});

describe("Insert", () => {
	it("should support insert", () => {
		check(
			insertInto(contacts).value({ firstname: "1", lastname: "2", parentFirstname: "3", parentLastname: "4" }),
			`INSERT INTO contacts(firstname, lastname, "parentFirstname", "parentLastname") VALUES ($1, $2, $3, $4)`, ["1", "2", "3", "4"]
		);

		check(
			insertInto(contacts).values([
				{ firstname: "1", lastname: "2", parentFirstname: "3", parentLastname: "4" },
				{ firstname: "3", lastname: "2", parentFirstname: "3", parentLastname: "4" }
			]).returning("id"),
			`INSERT INTO contacts(firstname, lastname, "parentFirstname", "parentLastname") VALUES ($1, $2, $3, $4), ($5, $6, $7, $8) RETURNING id`, ["1", "2", "3", "4", "3", "2", "3", "4"]
		);

		check(
			insertInto(contacts).valuesFrom(from(contacts).select(contacts.firstname, contacts.lastname, contacts.parentFirstname, contacts.parentLastname)),
			`INSERT INTO contacts(firstname, lastname, "parentFirstname", "parentLastname") SELECT firstname, lastname, "parentFirstname", "parentLastname" FROM contacts`, []
		);
	});
});