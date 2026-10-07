import * as vscode from 'vscode';

import {
	addDict, addList, addProjectFromInput, deleteItem, getPathFromItem,
	openProjectsSettings, openWindow, renameItem, revealInFileExplorer,
} from './lib/Action';
import { DeepJsonItem, DeepJsonProvider } from './lib/DeepJsonProvider';
import { getProjectsJsonUri } from './lib/Util';

export function activate(context: vscode.ExtensionContext) {
	const treeView = new DeepJsonProvider(context);
	context.subscriptions.push(treeView);

	const commands: Record<string, (...args: any[]) => unknown> = {
		"projectManagerDeepJson.openWindowThis": (item: DeepJsonItem) => openWindow(item, false),
		"projectManagerDeepJson.openWindowNew": (item: DeepJsonItem) => openWindow(item, true),
		"projectManagerDeepJson.openJson": () => openProjectsSettings(context, false),
		"projectManagerDeepJson.openJsonFolder": () => openProjectsSettings(context, true),
		"projectManagerDeepJson.addProject": () => treeView.addProject(),
		"projectManagerDeepJson.addProjectFromInput": () => addProjectFromInput(treeView),
		"projectManagerDeepJson.addTo": (uri: vscode.Uri) => treeView.addProject(uri),
		"projectManagerDeepJson.renameItem": (item: DeepJsonItem) => renameItem(treeView, item),
		"projectManagerDeepJson.deleteItem": (item: DeepJsonItem) => deleteItem(treeView, item),
		"projectManagerDeepJson.createList": (item: DeepJsonItem) => addList(treeView, item),
		"projectManagerDeepJson.createDict": (item: DeepJsonItem) => addDict(treeView, item),
		"projectManagerDeepJson.getPath": (item: DeepJsonItem) => getPathFromItem(item),
		"projectManagerDeepJson.revealInFileExplorer": (item: DeepJsonItem) => revealInFileExplorer(item),
		"projectManagerDeepJson.refresh": () => treeView.refresh(),
	};
	for (const [id, handler] of Object.entries(commands)) {
		context.subscriptions.push(vscode.commands.registerCommand(id, handler));
	}

	// このウィンドウで projects.jsonc を直接編集・保存したときも即反映する
	context.subscriptions.push(vscode.workspace.onDidSaveTextDocument(doc => {
		if (doc.uri.fsPath === getProjectsJsonUri(context).fsPath) {
			treeView.refresh();
		}
	}));
}

export function deactivate() { }
