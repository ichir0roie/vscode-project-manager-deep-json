import * as vscode from 'vscode';

import { DeepJsonItem, DeepJsonProvider } from "./DeepJsonProvider";
import { getProjectsJsonUri } from "./Util";

function pathsOf(item: DeepJsonItem): string[] {
    if (typeof item.value === "string") { return [item.value]; }
    if (Array.isArray(item.value)) { return item.value; }
    return [];
}

export async function openWindow(item: DeepJsonItem, forceNewWindow: boolean) {
    const paths = pathsOf(item);
    if (paths.length === 0) {
        vscode.window.showInformationMessage("This item has no path.");
        return;
    }
    for (const path of paths) {
        // 複数パスのときは必ず新しいウィンドウで開く
        await vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(path),
            { forceNewWindow: forceNewWindow || paths.length > 1 });
    }
}

export async function openProjectsSettings(context: vscode.ExtensionContext, folder: boolean) {
    if (folder) {
        await vscode.commands.executeCommand("vscode.openFolder", context.globalStorageUri, { forceNewWindow: true });
    } else {
        await vscode.window.showTextDocument(getProjectsJsonUri(context));
    }
}

async function inputName(prompt: string): Promise<string | undefined> {
    const name = await vscode.window.showInputBox({ prompt });
    return name === undefined || name === "" ? undefined : name;
}

export async function renameItem(treeView: DeepJsonProvider, item: DeepJsonItem) {
    const newKey = await inputName(`Rename "${item.key}"`);
    if (newKey === undefined) { return; }
    await treeView.renameItem(item, newKey);
}

export async function deleteItem(treeView: DeepJsonProvider, item: DeepJsonItem) {
    const answer = await vscode.window.showWarningMessage(`Delete "${item.key}"?`, { modal: true }, "Delete");
    if (answer !== "Delete") { return; }
    await treeView.deleteItem(item);
}

export async function addList(treeView: DeepJsonProvider, item: DeepJsonItem) {
    const key = await inputName("New list name");
    if (key === undefined) { return; }
    await treeView.addChild(item, key, []);
}

export async function addDict(treeView: DeepJsonProvider, item: DeepJsonItem) {
    const key = await inputName("New dict name");
    if (key === undefined) { return; }
    await treeView.addChild(item, key, {});
}

export async function getPathFromItem(item: DeepJsonItem) {
    const paths = pathsOf(item);
    const text = paths.length > 0 ? paths.join("\n") : JSON.stringify(item.value, null, 2);
    await vscode.env.clipboard.writeText(text);
}

export async function addProjectFromInput(treeView: DeepJsonProvider) {
    const res = await inputName("Project path");
    if (res === undefined) { return; }
    await treeView.addProject(vscode.Uri.file(res));
}

// OS 標準のファイルマネージャで開く。exec("start ...") は Windows 専用だったので VS Code の組み込みコマンドに置き換え
export async function revealInFileExplorer(item: DeepJsonItem) {
    const paths = pathsOf(item);
    if (paths.length === 0) {
        vscode.window.showInformationMessage("This item has no path.");
        return;
    }
    for (const path of paths) {
        await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(path));
    }
}
