# @hediet/typed-sql

[![Build Status](https://travis-ci.org/hediet/ts-typed-sql.svg?branch=master)](https://travis-ci.org/hediet/ts-typed-sql)
[![Coverage Status](https://coveralls.io/repos/github/hediet/ts-typed-sql/badge.svg?branch=master)](https://coveralls.io/github/hediet/ts-typed-sql?branch=master)

A fully typed sql builder. Works best with TypeScript an Visual Studio Code.
Currently only has support for PostgreSql, however, it should be very easy to implement SQL Generators for other SQL dialects.

## Installation

`@hediet/typed-sql` can be installed via the node package manager using the command `npm install @hediet/typed-sql --save`.

## Usage

This documentation is far from complete.
However, most of the features are self-explanatory and can easily be explored by using the intellisense.
Intellisense works great when using this library from TypeScript in VS Code.

### Preparation

For proper typing, all used tables must be defined:
```ts
import { table, column } from "@hediet/typed-sql";

const contacts = table({ name: "contacts", schema: "public" },
	{
		firstname: column<string>(),
		lastname: column<string>(),
		mother_id: column<number | null>(),
		father_id: column<number | null>()
	},
	{ id: column<number>() }
);

...
```

### Connection

SQL queries are processed by an instance of `DbConnection`.
To construct a `DbConnection`, a query service is required:
```ts
import { DbConnection, PostgreQueryService } from "@hediet/typed-sql";
import pg = require("pg");

const pool = new pg.Pool({
	database: "postgres",
	user: "postgres",
	password: "FXLjrQ0"
});

const queryService = new PostgreQueryService(pool, { shortenColumnNameIfUnambigous: true, skipQuotingIfNotRequired: true });
const dbCon = new DbConnection(queryService);

```

### Some Queries

Queries are independent of `DbConnection`, however, an instance of `DbConnection` is needed to execute queries.
If `q` is a query, it can be executed by one of the methods that `DbConnection` provides:
```ts
await dbCon.exec(q); // returns all rows
await dbCon.firstOrUndefined(q); // returns the first row if there is any, otherwise undefined.
await dbCon.first(q); // returns the first row and throws an error if there is no row.
await dbCon.single(q); // returns the first row and ensures there is only one.
```

#### Select Queries
##### Basic Select
```ts
import { select, concat } from "hediet-typed-sql";

// Selects the id column from the contacts table.
await dbCon.exec(from(contacts).select("id"));

from(contacts).select(contacts.id.as("myId")); // selects id and renames it to "myId"
from(contacts).select(contacts.$all); // selects all columns

// Even complex expressions can be selected
from(contacts).select(concat(contacts.firstname, " ", contacts.lastname).as("fullName"));

```

##### Where
```ts
// a where clause takes any expression of type boolean.
from(contacts).where(contacts.name.isLike("Jon%");
```

##### Joins
```ts
const p = contacts.as("parents");

from(contacts)
	.leftJoin(p).on(
		p.id.isEqualTo(contacts.mother_id).or(p.id.isEqualTo(contacts.father_id))
	)

```

### Delete
```ts
deleteFrom(contacts)
	.where(contacts.id.isIn([1, 2, 3]))
	.returning("id")
```

### Insert
```ts
const id = await dbCon.firstValue(
	insertInto(contacts)
		.value({ firstname: "Hoster", lastname: "Tully", father_id: null, mother_id: null })
		.returning("id")
);

insertInto(contacts).valuesFrom(
	from(contacts)
		.select("firstname", "father_id", "mother_id")
		.select(concat(contacts.lastname, "2").as("lastname"))
)
```

### Update
```ts
update(contacts)
	.set({ firstname: "test" })
	.where({ id: 1 })
```