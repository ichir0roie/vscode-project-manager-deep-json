import { DeepJsonItem, DeepJsonProvider } from "./DeepJsonProvider";

import * as vscode from 'vscode';

import { getProjectsJsonUri, replaceZettai } from "./Util";

import { exec } from "child_process";

export async function openWindowNew(item: DeepJsonItem) {
    openWindow(item, true);
}
export async function openWindowThis(item: DeepJsonItem) {
    openWindow(item, false);
}
async function openWindow(item: DeepJsonItem, forceNewWindow: boolean) {

    if (typeof item.childrenJsonValue === "string") {
        openWindowExecute(item.childrenJsonValue, forceNewWindow);
    } else if (Array.isArray(item.childrenJsonValue)) {
        item.childrenJsonValue.forEach(async (path: string) => {
            openWindowExecute(path, true);
        });
    } else if (item.rootOpenPath !== undefined) {
        openWindowExecute(item.rootOpenPath, forceNewWindow);
    }
    // let success=await vscode.commands.executeCommand("vscode.openFolder");
}

async function openWindowExecute(path: string, forceNewWindow: boolean) {
    const uri = vscode.Uri.file(path);
    let success = await vscode.commands.executeCommand("vscode.openFolder", uri, { "forceNewWindow": forceNewWindow });
}

export function openProjectsSettings(context: vscode.ExtensionContext, folder: boolean) {
    if (folder) {
        openWindowExecute(context.globalStorageUri.fsPath, true);
    } else {
        vscode.window.showTextDocument(getProjectsJsonUri(context));
    }
}

export async function renameItem(treeView: DeepJsonProvider, treeItem: DeepJsonItem) {

    const renameKey = await createName(treeView, treeItem);
    if (renameKey === undefined) { return; }

    let state = vscode.TreeItemCollapsibleState.Collapsed;
    if (treeItem.collapsibleState !== undefined) {
        state = treeItem.collapsibleState;
    }
    if (treeItem.parent !== undefined) {
        delete treeItem.parent?.childrenJsonValue[treeItem.key];
        treeItem.parent.childrenJsonValue[renameKey] = treeItem.childrenJsonValue;
        treeView._onDidChangeTreeData.fire(new Array(treeItem.parent));
    } else {
        delete treeView.projects[treeItem.key];
        treeView.projects[renameKey] = treeItem.childrenJsonValue;
        treeView._onDidChangeTreeData.fire(undefined);
    }

    treeView.saveProjects();

}

export async function deleteItem(treeView: DeepJsonProvider, treeItem: DeepJsonItem) {
    if (treeItem.parent === undefined) {
        delete treeView.projects[treeItem.key];
        treeView._onDidChangeTreeData.fire(undefined);
    } else {
        delete treeItem.parent?.childrenJsonValue[treeItem.key];
        treeView._onDidChangeTreeData.fire(new Array(treeItem.parent));
    }
    treeView.saveProjects();
}

export async function addList(treeView: DeepJsonProvider, treeItem: DeepJsonItem) {
    const renameKey = await vscode.window.showInputBox();
    if (renameKey === undefined) { return; }

    if (typeof treeItem.childrenJsonValue === "object") {
        treeItem.childrenJsonValue[renameKey] = [];
        treeItem.initializeInfo();
    }
    treeView._onDidChangeTreeData.fire(new Array(treeItem));
    treeView.saveProjects();
}

export async function addDict(treeView: DeepJsonProvider, treeItem: DeepJsonItem) {
    const renameKey = await vscode.window.showInputBox();
    if (renameKey === undefined) { return; }

    if (typeof treeItem.childrenJsonValue === "object") {
        treeItem.childrenJsonValue[renameKey] = {};
        treeItem.initializeInfo();
    }
    treeView._onDidChangeTreeData.fire(new Array(treeItem));
    treeView.saveProjects();
}

async function createName(treeView: DeepJsonProvider, treeItem: DeepJsonItem): Promise<string | undefined> {
    const renameKey = await vscode.window.showInputBox();
    if (renameKey === undefined || renameKey === "") { return undefined; }

    if (treeItem.parent === undefined) {
        if (renameKey in treeView.projects) {
            return undefined;
        }
    } else if (renameKey in treeItem.parent?.childrenJsonValue) {
        return undefined;
    }

    return renameKey;
}

export async function addToPMDJ(treeView: DeepJsonProvider, uri: vscode.Uri) {
    treeView.addProject(uri);
}


export async function getPathFromItem(treeItem: DeepJsonItem) {
    const obj = treeItem.childrenJsonValue;
    if (typeof obj === "string") {
        vscode.env.clipboard.writeText(obj);
    } else if (typeof obj === "object") {
        vscode.env.clipboard.writeText(JSON.stringify(obj));
    } else if (Array.isArray(obj)) {
        let str = "";
        obj.forEach(line => {
            str += line + "\n";
        });
        vscode.env.clipboard.writeText(JSON.stringify(str));
    } else {
        vscode.window.showInformationMessage("can not get path");
        return;
    }
}

export async function addProjectFromPath(treeView: DeepJsonProvider) {
    const res = await vscode.window.showInputBox();
    if (res === undefined) { return; }

    treeView.addProject(vscode.Uri.file(res));

}

export async function revealInFileExplorer(treeItem: DeepJsonItem) {
    const obj = treeItem.childrenJsonValue;
    if (typeof obj === "string") {
        exec(`start "" "${obj}"`);
    } else if (Array.isArray(obj)) {
        obj.forEach(line => {
            exec(`start "" "${line}"`);
        });
    } else {
        vscode.window.showInformationMessage("can open in File Explorer");
        return;
    }
}

