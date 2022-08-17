import { DeepJsonItem,addProject } from "./DeepJsonProvider";
import * as vscode from 'vscode';

import { getRootPath } from "./Util";

export async function openWindowNew(item:DeepJsonItem){
    openWindow(item,true);
}
export async function openWindowThis(item:DeepJsonItem){
    openWindow(item,false);
}
async function openWindow(item:DeepJsonItem,forceNewWindow:boolean){
    
    const path=item.description;
    if (path===undefined){
        return;
    }
    const uri=vscode.Uri.file(path.toString());
    let success=await vscode.commands.executeCommand("vscode.openFolder",uri,{"forceNewWindow":forceNewWindow});
    // let success=await vscode.commands.executeCommand("vscode.openFolder");
}

export async function addFolder(context: vscode.ExtensionContext) {
    const rootPath=getRootPath();
    if(rootPath===undefined){return;}
    addProject(context,undefined,rootPath);
}