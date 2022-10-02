// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import { projectManagerDeepJsonProvider } from './lib/projectManagerDeepJsonProvider';


import { openProjectsSettings, openWindowNew, openWindowThis } from './lib/Action';

import { DeepJsonProvider } from './lib/DeepJsonProvider';
import SettingsProvider from './lib/SettingsProvider';
import { getProjectsJsonUri } from './lib/Util';

let dsp: DeepJsonProvider;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	dsp = new DeepJsonProvider(context);

	let disposable: vscode.Disposable;
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openWindowThis", (args) => {
		openWindowThis(args);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.openWindowNew", (args) => {
		openWindowNew(args);
	});
	context.subscriptions.push(disposable);
	disposable = vscode.commands.registerCommand("projectManagerDeepJson.refreshJson", async (args) => {
		dsp = new DeepJsonProvider(context);
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
		dsp.addProject();
	});
	context.subscriptions.push(disposable);

	new DeepJsonProvider(context);

	vscode.workspace.onDidSaveTextDocument((e) => {
		if (e.uri.fsPath === getProjectsJsonUri(context).fsPath) {
			dsp = new DeepJsonProvider(context);
		}

	});
}

// this method is called when your extension is deactivated
export function deactivate() {
}
