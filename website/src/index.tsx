import * as React from "react";
import * as ReactDOM from "react-dom";
import * as cn from "classnames";
import { observable, computed, autorun } from "mobx";
import { observer } from "mobx-react";
import DevTools from 'mobx-react-devtools'; 
import "./style.scss";
import MonacoEditor from 'react-monaco-editor';
import * as ts from "typescript";
import * as sql from "../../";
import { Maybe, isError, error, result } from "hediet-framework/api/containers";

const context = require.context('!raw-loader!../../src/', true, /\.(ts)$/);

const declarationFiles: { [name: string]: string } = {};

context.keys().forEach((filename: string) => {
	declarationFiles[filename] = context(filename);
});


type ICodeEditor = monaco.editor.ICodeEditor;

class Model {
	@observable windowWidth: number;
	@observable windowHeight: number;
}


var model = new Model();
model.windowWidth = window.innerWidth;
model.windowHeight = window.innerHeight;

window.onresize = function() {
	model.windowWidth = window.innerWidth;
	model.windowHeight = window.innerHeight;
};

type SqlStatement = Maybe<{
	sql: string;
	args: any[];
}, { error: string }>;

class View extends React.Component<{ onHeightUpdate?: () => void, sqlStatement: SqlStatement }, {}> {
	private componentDidMount() {
		if (this.props.onHeightUpdate) this.props.onHeightUpdate();
	}

	private componentDidUpdate() {
		if (this.props.onHeightUpdate) this.props.onHeightUpdate();
	}

	public render() {
		const statement = this.props.sqlStatement;
		if (isError(statement)) {
			return (
				<div className="sqlView"><span className="error">{ statement.value.error }</span></div>
			);
		}
		return (
			<div className="sqlView"><span className="sql">{ statement.value.sql }</span><span className="args">{ JSON.stringify(statement.value.args) }</span></div>
		);
	}
}

class SqlViewerZone {
	private zoneId: number;

	private static lastHeight: number = 20;

	constructor(private readonly editor: monaco.editor.ICodeEditor, lineNumber: number, sqlStatement: SqlStatement) {
		const d = document.createElement("div");

		const zone = {
			afterLineNumber: lineNumber,
			domNode: d,
			heightInPx: SqlViewerZone.lastHeight,
			suppressMouseDown: false
		};
		console.log(SqlViewerZone.lastHeight);

		editor.changeViewZones((accessor) => {
			this.zoneId = accessor.addZone(zone);
		});

		ReactDOM.render(
			<View sqlStatement={sqlStatement} onHeightUpdate={() => {
					setTimeout(() => {
						return;
						if (!d.childNodes[0] || d.childNodes[0].offsetHeight === 0) return; 

						zone.heightInPx = d.childNodes[0].offsetHeight;
						SqlViewerZone.lastHeight = zone.heightInPx;
						editor.changeViewZones((accessor) => {
							if (this.zoneId === -1) throw "";
							accessor.layoutZone(this.zoneId);
						});
					}, 50);
				}
			} />
		, d);
		d.style.zIndex = "1";
	}

	public destroy() {
		this.editor.changeViewZones((accessor) => {
			accessor.removeZone(this.zoneId);
		});
	}
}

@observer
class GUI extends React.Component<{}, {}> {
	private editor: monaco.editor.ICodeEditor;

	private async editorDidMount(editor: monaco.editor.ICodeEditor) {
		this.editor = editor;
		
		editor.setModel(monaco.editor.createModel(
`import { select, from, val, table, column, concat, deleteFrom, insertInto, values, update } from "hediet-typed-sql";

// table definitions.

const organizations = table("organizations",
	{ name: column<string>(), parentOrganizationId: column<number>(), },
	{ id: column<number>() }
);

const customers = table({ name: "customers", schema: "public" },
	{ firstname: column<string>(), lastname: column<string>(), country: column<string>() },
	{ id: column<number>() }
);

const orders = table({ name: "orders", schema: "public" },
	{ customerId: column<number>(), orderDate: column<Date>() },
	{ id: column<number>() }
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
insertInto(customers).value({ firstname: "John", lastname: "Doe", country: "de" });

insertInto(customers).valuesFrom(from(customers).select(val("de").as("country")).select("firstname", "lastname"));

// Delete
deleteFrom(orders).where({ id: 0 });

`, "typescript", monaco.Uri.parse("file:///main.ts")));

		let m = editor.getModel() as monaco.editor.IModel;
		monaco.languages.typescript.typescriptDefaults.setCompilerOptions({ moduleResolution: 2 }); // ModuleResolutionKind.NodeJs

		for (const fileName of Object.keys(declarationFiles)) {
			monaco.languages.typescript.typescriptDefaults.addExtraLib(
				declarationFiles[fileName], "file:///node_modules/hediet-typed-sql/" + fileName)
		}

		autorun(() => {
			model.windowWidth + model.windowHeight;
			console.log("layout");
			editor.layout();
		});

		this.onChange();
	}

	private zones: SqlViewerZone[] = [];

	private readonly sqlGenerator = new sql.PostgreSqlGenerator({ shortenColumnNameIfUnambigous: true, skipQuotingIfNotRequired: true });

	private findSqlQueryExpressions(sf: ts.SourceFile) {
		function findSelectExpressions(node: ts.Node, result: ts.CallExpression[]) {
			for (const n of node.getChildren()) {
				if (n.kind === ts.SyntaxKind.CallExpression) {
					const n2 = n as ts.CallExpression;
					const keywords = [ "select", "from", "values", "insertInto", "deleteFrom", "update" ];
					if (n2.expression && n2.expression.kind === ts.SyntaxKind.Identifier && 
						keywords.indexOf((n2.expression as ts.Identifier).text) !== -1) {

						let lastParent = n2;
						let parent = lastParent.parent;
						console.log(ts.SyntaxKind[(parent as ts.CallExpression).kind]);
						while (parent && ((parent.kind === ts.SyntaxKind.CallExpression && (parent as ts.CallExpression).expression === lastParent) ||
										(parent.kind === ts.SyntaxKind.PropertyAccessExpression) && (parent as ts.PropertyAccessExpression).expression === lastParent)) {
							lastParent = parent as ts.CallExpression;
							parent = lastParent.parent;
						}
						result.push(lastParent);
					}
				}
				findSelectExpressions(n, result);
			}
		}
		let result: ts.CallExpression[] = [];
		findSelectExpressions(sf, result);

		return result;
	}

	private async onChange(): Promise<void> {
		var m = this.editor.getModel() as monaco.editor.IModel;

		const editor = this.editor as monaco.editor.ICodeEditor;
		
		const worker = await monaco.languages.typescript.getTypeScriptWorker();
		const svc = await worker(m.uri.toString());
		const diags1 = await svc.getSyntacticDiagnostics(m.uri.toString());
		const diags2 = await svc.getSemanticDiagnostics(m.uri.toString());

		console.log(svc);

		if (diags1.length + diags2.length > 0) return;

		const sf = ts.createSourceFile("main.ts", m.getValue(), ts.ScriptTarget.ESNext, true, ts.ScriptKind.TS);

		let i = 0;

		const exprs = this.findSqlQueryExpressions(sf);
		exprs.sort((a, b) => b.end - a.end); // descending

		let lastStart = sf.end;
		let src = sf.getText();
		let id = 0;
		for (const expr of exprs) {
			id++;

			const start = expr.getStart(sf, false);
			if (start <= lastStart) {
				src = src.substring(0, start) + `log(${id}, () => (${expr.getText(sf)}))` + src.substr(expr.end);
			}
		
			lastStart = start;
		}
		
		src = ts.transpile(src, { module: ts.ModuleKind.AMD });

		const self = this;

		function define(args: string[], func: any) {
			func(undefined, {}, sql);
		}

		const sqlStatements: { [id: number]: SqlStatement } = {};

		function log(id: number, query: () => sql.Query<any, any>) {
			try {
				const q = query();
			
				if (!(q instanceof sql.Query)) return;
				const s = self.sqlGenerator.toSql(q);
				sqlStatements[id] = result({ sql: s.sql, args: s.parameters });
			}
			catch (err) {
				sqlStatements[id] = error({ error: err.toString() });
			}
		}

		
		eval(src);
		
		const scrollTop = editor.getScrollTop();
		for (const zone of this.zones)
			zone.destroy();
		this.zones = [];

		id = 0;
		for (const expr of exprs) {
			id++;

			const endPos = expr.getEnd();
			const p = m.getPositionAt(endPos);
			if (sqlStatements[id])
				this.zones.push(new SqlViewerZone(editor, p.lineNumber, sqlStatements[id]));
		}

		this.editor.setScrollTop(scrollTop);
	}

	render() {
		return (
			<div className="page">
				<div className="header">
					<h1>@hediet/typed-sql - Playground</h1>
				</div>
				<div className="editor">
					<MonacoEditor
						options={ { scrollBeyondLastLine: false } }
						defaultValue={``}
						width="100%"
						height="100%"
						language="typescript"
						editorDidMount={this.editorDidMount.bind(this)}
						onChange={this.onChange.bind(this)}
					/>
				</div>
			</div>
		);
	}
}

var target = document.createElement("div");
target.className = "container";
ReactDOM.render(<div className="container"><GUI /></div>, target); //<DevTools />
document.body.appendChild(target);

