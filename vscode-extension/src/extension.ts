// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// import { projectManagerDeepJsonProvider } from './lib/projectManagerDeepJsonProvider';


import { addDict, addList, addProjectFromPath as addProjectFromInput, addToPMDJ, deleteItem, getPathFromItem, openProjectsSettings, openWindowNew, openWindowThis, renameItem, revealInFileExplorer } from './lib/Action';

import { DeepJsonItem, DeepJsonProvider } from './lib/DeepJsonProvider';
import SettingsProvider from './lib/SettingsProvider';
import { getProjectsJsonUri } from './lib/Util';

import { getWebviewContent } from "./lib/webView/ui/sample";

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
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand("projectManagerDeepJson.createList",
		(treeItem: DeepJsonItem) => {
			addList(treeView, treeItem);
		}
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand("projectManagerDeepJson.createDict",
		(treeItem: DeepJsonItem) => {
			addDict(treeView, treeItem);
		}
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand("projectManagerDeepJson.deleteItem",
		(treeItem: DeepJsonItem) => {
			deleteItem(treeView, treeItem);
		}
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand("projectManagerDeepJson.refresh",
		() => {
			treeView = new DeepJsonProvider(context);
		}
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand("projectManagerDeepJson.addTo",
		(uri: vscode.Uri) => {
			addToPMDJ(treeView, uri);
		}
	);
	context.subscriptions.push(disposable);


	disposable = vscode.commands.registerCommand("projectManagerDeepJson.getPath",
		(treeItem: DeepJsonItem) => {
			getPathFromItem(treeItem);
		}
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand("projectManagerDeepJson.addProjectFromInput",
		() => {
			addProjectFromInput(treeView);
		}
	);
	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand("projectManagerDeepJson.revealInFileExplorer",
		(treeItem: DeepJsonItem) => {
			revealInFileExplorer(treeItem);
		}
	);
	context.subscriptions.push(disposable);

	// https://code.visualstudio.com/api/extension-guides/webview
	context.subscriptions.push(
		vscode.commands.registerCommand('catCoding.start', () => {
			// Create and show a new webview
			const panel = vscode.window.createWebviewPanel(
				'catCoding', // Identifies the type of the webview. Used internally
				'Cat Coding', // Title of the panel displayed to the user
				vscode.ViewColumn.One, // Editor column to show the new webview panel in.
				{} // Webview options. More on these later.
			);


			let iteration = 0;
			const updateWebview = () => {
				const cat = iteration++ % 2 ? 'Compiling Cat' : 'Coding Cat';
				panel.title = cat;
				panel.webview.html = getWebviewContent(cat);
			};

			// Set initial content
			updateWebview();

			// And schedule updates to the content every second
			setInterval(updateWebview, 1000);
		})
	);
	context.subscriptions.push(disposable);



	vscode.workspace.onDidSaveTextDocument((e) => {
		if (e.uri.fsPath === getProjectsJsonUri(context).fsPath) {
			treeView = new DeepJsonProvider(context);
		}
	});


}

// this method is called when your extension is deactivated
export function deactivate() {
}
