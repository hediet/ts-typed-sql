declare module "react-monaco-editor" {
	interface IMonacoEditorProps {
		width: any;
		height: any;
		value?: string;
		defaultValue?: string;
		language: string;
		options?: monaco.editor.IEditorOptions;
		onChange?: (newValue: string, event: monaco.editor.IModelContentChangedEvent2) => void;
		editorWillMount?: (monacoModule: typeof monaco) => void;
		editorDidMount?: (editor: monaco.editor.IEditor, monacoModule: typeof monaco) => void;
	}

	export default class MonacoEditor extends React.Component<IMonacoEditorProps, {}> {
	}
}