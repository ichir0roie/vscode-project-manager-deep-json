// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import { projectManagerDeepJsonProvider } from './lib/projectManagerDeepJsonProvider';

import {register} from './lib/DeepJsonProvider';

import { openNewWindow } from './lib/OpenNewWindow';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable:vscode.Disposable;
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openEntry", (args) => {
		openNewWindow(args);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.refreshEntry", (args) => {
		register();
	});
	context.subscriptions.push(disposable);

	register();

}

// this method is called when your extension is deactivated
export function deactivate() { }
