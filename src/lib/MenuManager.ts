import { DeepJsonItem,addProject } from "./DeepJsonProvider";
import * as vscode from 'vscode';

import { getRootPath } from "./Util";

export async function openNewWindow(item:DeepJsonItem){
    
    const path=item.description;
    if (path===undefined){
        return;
    }
    const uri=vscode.Uri.file(path.toString());
    let success=await vscode.commands.executeCommand("vscode.openFolder",uri,{"forceNewWindow":true});
    // let success=await vscode.commands.executeCommand("vscode.openFolder");
    console.log(success);
}

export async function addFolder(context: vscode.ExtensionContext) {
    const rootPath=getRootPath();
    if(rootPath===undefined){return;}
    addProject(context,undefined,rootPath);
}