// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import { projectManagerDeepJsonProvider } from './lib/projectManagerDeepJsonProvider';

import {register,create,openProjectsSettings,formatProjectSettingJson} from './lib/DeepJsonProvider';

import * as MenuManager from './lib/MenuManager';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	
	await formatProjectSettingJson(context);
	
	let disposable:vscode.Disposable;
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openWindowThis", (args) => {
		MenuManager.openWindowThis(args);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openWindowNew", (args) => {
		MenuManager.openWindowNew(args);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.refreshJson", async (args) => {
		await formatProjectSettingJson(context);
		register(context);
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
