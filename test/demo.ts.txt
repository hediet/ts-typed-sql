import { select, from, table, column, DbConnection, insertInto, update, val, defaultValue, SqlGenerator, PostgreQueryService, concat, not, deleteFrom, FromItem, ImplicitColumns, values, FromItemToImplicitColumns } from "../src/index";
import pg = require("pg");

const contacts = table({ name: "contacts", schema: "public" },
	{
		firstname: column<string>(),
		lastname: column<string>(),
		mother_id: column<number | null>(),
		father_id: column<number | null>()
	},
	{ id: column<number>() }
);

let x: FromItemToImplicitColumns<typeof contacts>;

const pool = new pg.Pool({
	database: "postgres",
	user: "postgres",
	password: "FXLjrQ0"
});


(async function () {
	try {
		const queryService = new PostgreQueryService(pool, { shortenColumnNameIfUnambigous: true, skipQuotingIfNotRequired: true });

		queryService.onSqlStatement.sub((queryService, args) => {
			console.log(args.sql, args.parameters);
		});
		const dbCon = new DbConnection(queryService);


/*
		const vals = values([{ foo: 1, bar: 2 }, { foo: 10, bar: 100 }]).as("vals");
		console.log(await dbCon.exec(
			from(vals).select(vals.foo)
		));
		return;*/

		await dbCon.exec(deleteFrom(contacts).where(val(true)));
		await dbCon.exec(insertInto(contacts).value(
			{ firstname: "Hoster", lastname: "Tully", father_id: null, mother_id: null, id: 0 },
			{ firstname: "Catelyn", lastname: "Tully", father_id: 0, mother_id: null, id: 1 },
			{ firstname: "Lysa", lastname: "Tully", father_id: 0, mother_id: null, id: 2 },
			{ firstname: "Edmure", lastname: "Tully", father_id: 0, mother_id: null, id: 3 },

			{ firstname: "Rickard", lastname: "Stark", father_id: null, mother_id: null, id: 4 },
			{ firstname: "Benjen", lastname: "Stark", father_id: 4, mother_id: null, id: 5 },
			{ firstname: "Brandon", lastname: "Stark", father_id: 4, mother_id: null, id: 6 },
			{ firstname: "Lyanna", lastname: "Stark", father_id: 4, mother_id: null, id: 7 },
			{ firstname: "Eddard", lastname: "Stark", father_id: 4, mother_id: null, id: 8 },

			{ firstname: "Robb", lastname: "Stark", father_id: 8, mother_id: 1, id: 9 },
			{ firstname: "Sansa", lastname: "Stark", father_id: 8, mother_id: 1, id: 10 },
			{ firstname: "Arya", lastname: "Stark", father_id: 8, mother_id: 1, id: 11 }
		));

		const aryaId = await dbCon.firstValue(
			from(contacts).where(contacts.firstname.toLower().isLike("%arya%")).select("id")
		);

		const arya = contacts.as("arya");
		const siblingsOfArya = await dbCon.exec(
			from(contacts)
				.leftJoin(arya).on({ id: aryaId })
				.where({ father_id: arya.father_id, mother_id: arya.mother_id })
				.select(concat(contacts.firstname, val(" ", true), contacts.lastname).as("fullname"))
		);

		await dbCon.exec(
			deleteFrom(contacts).where(contacts.id.isEqualTo(
				from(contacts).where({ id: aryaId }).select(contacts.father_id).asExpression().cast<number>()
			))
		);

		console.log(siblingsOfArya.map(r => r.fullname));

	}
	finally {
		await pool.end();
	}
})();
