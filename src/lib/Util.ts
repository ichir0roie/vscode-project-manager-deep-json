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

