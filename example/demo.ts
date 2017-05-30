import { IntegerType, RecordTypeToJson } from '../src/AST/Types';
import { select, from, table, DbConnection, insertInto, update, val, defaultValue, SqlGenerator, 
	PostgreQueryService, concat, not, deleteFrom, FromItem, Row, values, Json, tText, tInteger, tJson, tIntegerEnum } from "../src/index";
import pg = require("pg");

enum Gender {
	Male, Female
}

const contacts = table({ name: "contacts", schema: "public" },
	{
		firstname: tText,
		lastname: tText,
		mother_id: tInteger.orNull(),
		father_id: tInteger.orNull(),
		gender: tIntegerEnum<Gender>()
	},
	{
		id: tInteger,
		data: tJson<{ foo: { bla: number, baz: string }, blubb: string }>().orNull()
	}
);


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

		await dbCon.exec(deleteFrom(contacts).where(val(true)));
		await dbCon.exec(insertInto(contacts).value(
			{ firstname: "Hoster", lastname: "Tully", father_id: null, mother_id: null, id: 0, gender: Gender.Male },
			{ firstname: "Catelyn", lastname: "Tully", father_id: 0, mother_id: null, id: 1, gender: Gender.Male },
			{ firstname: "Lysa", lastname: "Tully", father_id: 0, mother_id: null, id: 2, gender: Gender.Male },
			{ firstname: "Edmure", lastname: "Tully", father_id: 0, mother_id: null, id: 3, gender: Gender.Male },

			{ firstname: "Rickard", lastname: "Stark", father_id: null, mother_id: null, id: 4, gender: Gender.Male },
			{ firstname: "Benjen", lastname: "Stark", father_id: 4, mother_id: null, id: 5, gender: Gender.Male },
			{ firstname: "Brandon", lastname: "Stark", father_id: 4, mother_id: null, id: 6, gender: Gender.Male },
			{ firstname: "Lyanna", lastname: "Stark", father_id: 4, mother_id: null, id: 7, gender: Gender.Male },
			{ firstname: "Eddard", lastname: "Stark", father_id: 4, mother_id: null, id: 8, gender: Gender.Male },

			{ firstname: "Robb", lastname: "Stark", father_id: 8, mother_id: 1, id: 9, gender: Gender.Male },
			{ firstname: "Sansa", lastname: "Stark", father_id: 8, mother_id: 1, id: 10, gender: Gender.Male },
			{ firstname: "Arya", lastname: "Stark", father_id: 8, mother_id: 1, id: 11, gender: Gender.Male }
		));

		const aryaId = await dbCon.firstValue(
			from(contacts).where(contacts.firstname.toLower().isLike("%arya%")).select("id")
		);

		await dbCon.exec(update(contacts).where({ id: 0 }).set({ data: { foo: { bla: 1, baz: "1" }, blubb: "test" } }));
		const value = await dbCon.firstValue(from(contacts).where({ id: 0 }).select("data"));
		console.log("data: ", value);

		const arya = contacts.as("arya");
		const siblingsOfArya = await dbCon.exec(
			from(contacts)
				.leftJoin(arya).on({ id: aryaId })
				.where({ father_id: arya.father_id, mother_id: arya.mother_id })
				.select(concat(contacts.firstname, val(" ", true), contacts.lastname).as("fullname"))
		);

		await dbCon.exec(select(contacts.firstname.toLower(), contacts.data));

		await dbCon.exec(
			deleteFrom(contacts).where(contacts.id.isEqualTo(
				from(contacts).where({ id: aryaId }).select(contacts.father_id).asExpression().cast(tInteger)
			))
		);

		console.log(siblingsOfArya.map(r => r.fullname));

		const t3 = from(contacts).select(contacts.asExpression().as("p3")).where({ id: 0 }).as("t3");
		const t2 = from(t3).select(t3.asExpression().as("p2")).as("t2");
		const t1 = from(t2).select(t2.asExpression().as("p1")).as("t1");
		const r = await dbCon.first(from(t1).select(t1.asExpression().toJson().prop("p1").prop("p2").prop("p3").prop("data").as("result")));


	}
	finally {
		await pool.end();
	}
})();
