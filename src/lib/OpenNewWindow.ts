import { DeepJsonItem } from "./DeepJsonProvider";
import * as vscode from 'vscode';

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