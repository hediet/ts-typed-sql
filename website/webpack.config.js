var webpack = require('webpack');
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var SplitByPathPlugin = require('webpack-split-by-path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

var r = file => path.resolve(__dirname, file[0]);

module.exports = {
	entry: [ r`src/index.tsx` ],
	output: {
		path: r`dist`,
		filename: "[name]-[hash].js",
		chunkFilename: "[name]-[hash].js"
	},
	resolve: {
		extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js']
	},
	devtool: 'eval',
	module: {
		rules: [
			{ test: /\.css$/, loader: "style-loader!css-loader" },
			{ test: /\.scss$/, loader: "style-loader!css-loader!sass-loader" },
			{ test: /\.(jpe?g|png|gif)$/i, loader: "file-loader" },
			{ 
				test: /\.tsx?$/, loader: 'ts-loader',
				options: {
					transpileOnly: true
				} 
			}
		]
	},
	plugins: [
		// generates two bundles: One for ./src code, one for node_modules code.
		new SplitByPathPlugin([{ name: 'node_modules-bundle', path: r`node_modules` }],
			{ manifest: 'app-entry' }
		),
		// generates an index.html
		new HtmlWebpackPlugin(),
		new CopyWebpackPlugin([
			{
				from: "./patched_typescriptServices.js",
				to: "vs/language/typescript/lib/typescriptServices.js"
			},
			{
				from: 'node_modules/monaco-editor/min/vs',
				to: 'vs',
			}
		])
	]
};
