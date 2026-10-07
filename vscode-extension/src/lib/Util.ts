import * as vscode from 'vscode';

export function getRootPath(): string | undefined {
    const workspaceFile = vscode.workspace.workspaceFile;
    if (workspaceFile !== undefined) {
        return workspaceFile.fsPath;
    }
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export const PROJECTS_FILE_NAME = "projects.jsonc";
export const EXPAND_STATE_FILE_NAME = "expandState.json";

export function getProjectsJsonUri(context: vscode.ExtensionContext): vscode.Uri {
    return vscode.Uri.joinPath(context.globalStorageUri, PROJECTS_FILE_NAME);
}

export function getExpandStateJsonUri(context: vscode.ExtensionContext): vscode.Uri {
    return vscode.Uri.joinPath(context.globalStorageUri, EXPAND_STATE_FILE_NAME);
}

export function isPlainObject(value: unknown): value is Record<string, any> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

// キーの並びを保ったままリネームする
export function renameKey(obj: Record<string, any>, oldKey: string, newKey: string) {
    const entries = Object.entries(obj);
    for (const [key] of entries) {
        delete obj[key];
    }
    for (const [key, value] of entries) {
        obj[key === oldKey ? newKey : key] = value;
    }
}
