import { DeepJsonItem } from "./DeepJsonProvider";

import * as vscode from 'vscode';

import SettingsProvider from "./SettingsProvider";
import { getProjectsJsonUri, replaceZettai } from "./Util";
import { join } from "path";
import { json } from "stream/consumers";


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
