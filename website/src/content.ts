import { select, from, val, table, tText, tInteger, tJson, jsonVal, concat, deleteFrom, insertInto, values, update } from "hediet-typed-sql";

// table definitions.
const organizations = table("organizations",
	{ name: tText, parentOrganizationId: tInteger, },
	{ id: tInteger }
);

const customers = table({ name: "customers", schema: "public" },
	{ firstname: tText, lastname: tText, country: tText, data: tJson<{ key: string }>() },
	{ id: tInteger }
);

const orders = table({ name: "orders", schema: "public" },
	{ customerId: tInteger, orderDate: tText },
	{ id: tInteger }
);

// Select all columns from customers.
from(customers).select(customers.$all);

from(customers).select(concat(customers.firstname, " ", customers.lastname).as("fullname"));

from(customers).select("firstname").where({ id: 1 });

from(customers).select("id").where(customers.firstname.toLower().isLike("h%"));

from(customers).select(customers.$all).where(customers.id.isIn([1, 2]));

from(customers).select(customers.$all).where(customers.id.isInQuery(
	from(orders).select(orders.customerId)
));

from(orders).leftJoin(customers).on({ id: orders.id })
	.select(customers.$all)
	.select(orders.asExpression().toJson().as("order"))

// Simple Join:
from(orders)
	.leftJoin(customers).on({ id: orders.customerId })
	.select(orders.id, customers.lastname);

// Self Join:
const parentOrg = organizations.as("parent");
from(organizations)
	.leftJoin(parentOrg).on({ parentOrganizationId: organizations.id })
	.select(organizations.name.as("name"), parentOrg.name.as("parentName"));

// Join with group by:
from(orders).leftJoin(customers).on({ id: orders.customerId }).groupBy(customers.country).select(customers.$all.count().as("count"));


// Update
update(orders).set({ id: 0 }).where({ id: 10 });

// Insert
insertInto(customers).value({ firstname: "John", lastname: "Doe", country: "de", data: { key: "123" } });

insertInto(customers).valuesFrom(from(customers).select(val("de").as("country"), jsonVal({ key: "test" }).as("data")).select("firstname", "lastname"));

// Delete
deleteFrom(orders).where({ id: 0 });
