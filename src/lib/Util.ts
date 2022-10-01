import * as vscode from 'vscode';

export function getRootPath(): string | undefined {
    const workspaceFile = vscode.workspace.workspaceFile;
    if (vscode.workspace.workspaceFile !== undefined) {
        return vscode.workspace.workspaceFile.fsPath;
    } else {
        return vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
            ? vscode.workspace.workspaceFolders[0].uri.fsPath
            : undefined;
    }
}


export function replace(text: string, before: string, after: string): string {
    return text.split(before).join(after);
}

export function replaceZettai(text: string, before: string, after: string): string {
    while (text.indexOf(before) >= 0) {
        text = text.split(before).join(after);
    }
    return text;
}



export function getProjectsJsonUri(context: vscode.ExtensionContext): vscode.Uri {
    const globalUri = context.globalStorageUri;
    return vscode.Uri.file(globalUri.fsPath + "/projects.jsonc");
}
export function getExpandStateJsonUri(context: vscode.ExtensionContext): vscode.Uri {
    const globalUri = context.globalStorageUri;
    return vscode.Uri.file(globalUri.fsPath + "/expandState.json");
}