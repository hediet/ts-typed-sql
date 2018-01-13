import * as assert from "assert";
import * as sql from "../src";
import * as sqlFormatter from "sql-formatter";

const generator = new sql.PostgreSqlGenerator({});

/**
 * check the expected result of a query
 * 
 * TODO: format the queries on fail
 */
export function checkResult({
	query,
	expectedResult
}: {
	query: any;
	expectedResult:  { sql: string; parameters: any[] };
}) {
	const gotResult = JSON.parse(JSON.stringify(generator.toSql(query)));
	gotResult.sql = sqlFormatter.format(gotResult.sql);
	expectedResult.sql = sqlFormatter.format(expectedResult.sql);
	assert.equal(gotResult.sql, expectedResult.sql);
	assert.deepStrictEqual(gotResult.parameters, expectedResult.parameters);
}
