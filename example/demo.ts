import { IntegerType, RecordTypeToJson } from '../src/AST/Types';
import { select, from, table, DbConnection, insertInto, update, val, defaultValue, SqlGenerator, 
	PostgreQueryService, concat, not, deleteFrom, FromItem, Row, values, FromItemToRow, Json, tText, tInteger, tJson } from "../src/index";
import pg = require("pg");

const contacts = table({ name: "contacts", schema: "public" },
	{
		firstname: tText,
		lastname: tText,
		mother_id: tInteger.orNull(),
		father_id: tInteger.orNull(),
	},
	{
		id: tInteger,
		data: tJson<{ foo: { bla: number, baz: string }, blubb: string }>().orNull()
	}
);



let x: FromItemToRow<typeof contacts>;

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

		await dbCon.exec(update(contacts).where({ id: 0 }).set({ data: { foo: { bla: 1, baz: "1" }, blubb: "test" } }));


		const t3 = from(contacts).select(contacts.asExpression().as("p3")).where({ id: 0 }).as("t3");
		const t2 = from(t3).select(t3.asExpression().as("p2")).as("t2");
		const t1 = from(t2).select(t2.asExpression().as("p1")).as("t1");
		const r = await dbCon.first(from(t1).select(t1.asExpression().toJson().prop("p1").prop("p2").prop("p3").prop("data").as("result")));


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
				from(contacts).where({ id: aryaId }).select(contacts.father_id).asExpression().cast(tInteger)
			))
		);

		console.log(siblingsOfArya.map(r => r.fullname));

	}
	finally {
		await pool.end();
	}
})();
