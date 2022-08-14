// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import { projectManagerDeepJsonProvider } from './lib/projectManagerDeepJsonProvider';

import {register,create,openProjectsSettings} from './lib/DeepJsonProvider';

import * as MenuManager from './lib/MenuManager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let disposable:vscode.Disposable;
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openProject", (args) => {
		MenuManager.openNewWindow(args);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.refreshJson", (args) => {
		create(context);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openJson", (args) => {
		openProjectsSettings(context);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.addProject", () => {
		MenuManager.addFolder(context);
	});
	context.subscriptions.push(disposable);

	register(context);

}

// this method is called when your extension is deactivated
export function deactivate() { }
