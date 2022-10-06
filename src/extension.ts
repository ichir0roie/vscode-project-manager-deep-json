// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import { projectManagerDeepJsonProvider } from './lib/projectManagerDeepJsonProvider';


import { openProjectsSettings, openWindowNew, openWindowThis, renameItem } from './lib/Action';

import { DeepJsonItem, DeepJsonProvider } from './lib/DeepJsonProvider';
import SettingsProvider from './lib/SettingsProvider';
import { getProjectsJsonUri } from './lib/Util';

let treeView: DeepJsonProvider;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	treeView = new DeepJsonProvider(context);

	let disposable: vscode.Disposable;
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openWindowThis", (args) => {
		openWindowThis(args);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openWindowNew", (args) => {
		openWindowNew(args);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openJson", (args) => {
		openProjectsSettings(context, false);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openJsonFolder", (args) => {
		openProjectsSettings(context, true);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.addProject", () => {
		treeView.addProject();
	});
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand("projectManagerDeepJson.renameItem",
		(treeItem: DeepJsonItem) => {
			renameItem(treeView, treeItem);
		}
	);

	//TODO other method delete , create and create

	vscode.workspace.onDidSaveTextDocument((e) => {
		if (e.uri.fsPath === getProjectsJsonUri(context).fsPath) {
			treeView = new DeepJsonProvider(context);
		}
	});
}

// this method is called when your extension is deactivated
export function deactivate() {
}
