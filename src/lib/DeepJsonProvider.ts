import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { json } from 'stream/consumers';
import { TextDecoder, TextEncoder } from 'util';

export function register(context: vscode.ExtensionContext){
	vscode.window.registerTreeDataProvider(
		'projectManagerDeepJson',
		new DeepJsonProvider(context)
	);
	create(context);
}

export function create(context: vscode.ExtensionContext){
  vscode.window.createTreeView('projectManagerDeepJson', {
		treeDataProvider: new DeepJsonProvider(context)
	});
}

export class DeepJsonProvider implements vscode.TreeDataProvider<DeepJsonItem> {
  context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext){
    this.context=context;
  }
  getTreeItem(element: DeepJsonItem): vscode.TreeItem {
    return element;
  }

  // call initialize and expand
  getChildren(element?: DeepJsonItem): Thenable<DeepJsonItem[]> {
    if (element) {
      // this is child position!!
      return Promise.resolve(this.getChildItems(element));
    } else {
      // this is root position!!
      return Promise.resolve(this.getRootItems());
    }
  }


  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private async getRootItems(): Promise<DeepJsonItem[]> {
    // get root item!!
      const packageJson =await getProjectsJson(this.context);
      if(packageJson===undefined){
        return [];
      }
      return this.mapToTree(packageJson);
  }

  private getChildItems(item:DeepJsonItem):DeepJsonItem[]{
    return this.mapToTree(item.child);
  }


  private mapToTree(map:object):DeepJsonItem[]{
    let itemMap=new Array<DeepJsonItem>();
    toMap(map).forEach((value,key)=>{
      itemMap.push(new DeepJsonItem(key,value));
    });
    return itemMap;
  }
}

export class DeepJsonItem extends vscode.TreeItem {
  child:any;
  constructor(
    public readonly key: string,
    public readonly value:any
    ) {
    let state=vscode.TreeItemCollapsibleState.Collapsed;
    if(typeof value==="string"){
      state=vscode.TreeItemCollapsibleState.None;
    }
    super(key,state);
    if(typeof value==="string"){
      this.description=value;
      this.tooltip=value;
    }else{
      this.description=undefined;
      this.tooltip = undefined;
    }
    this.child=value;

    // this.tooltip="tooltip";
    // this.description="description";
  }
}


function toMap(jsonObject:any):Map<string,any>{
  return new Map<string,any>(Object.entries(jsonObject));
}

const projectsConfigSection='projectManagerDeepJson.projects';

async function getProjectsJson(context: vscode.ExtensionContext):Promise<any>{
  const projectsUri=getProjectsUri(context);

  let stat;
  try{
    stat=await vscode.workspace.fs.stat(projectsUri);
  }catch (e){
    const enc=new TextEncoder();
    await vscode.workspace.fs.writeFile(projectsUri,enc.encode("{}"));
  }

  const value=await vscode.workspace.fs.readFile(projectsUri);
  
  const dec=new TextDecoder();
  const json=JSON.parse(dec.decode(value));
  return json;
  
}



function getProjectsUri(context:vscode.ExtensionContext):vscode.Uri{
  const globalUri=context.globalStorageUri;
  return vscode.Uri.file(globalUri.fsPath+"/projects.json");
}

export function openProjectsSettings(context:vscode.ExtensionContext){
  const projectsUri=getProjectsUri(context);
  vscode.window.showTextDocument(projectsUri);
}

export async function addConfiguration(context: vscode.ExtensionContext,key:string|undefined,value:string){
  if(key===undefined){
    key=await vscode.window.showInputBox();
  }
  if(key===undefined){return;}

  const config=vscode.workspace.getConfiguration();
  let projectsJson=await getProjectsJson(context);

  const map=toMap(projectsJson);
  if (map.size<=0){
    vscode.window.showInformationMessage("setting file size is 0.");
  }else{
    //backup settings
    backupProject(projectsJson);
  }

  projectsJson[key]=value;
  
  const projectsUri=getProjectsUri(context);
  const enc=new TextEncoder();
  const uint8Array=enc.encode(JSON.stringify(projectsJson,null,2));
  await vscode.workspace.fs.writeFile(projectsUri,uint8Array);
  create(context);
}

function backupProject(projectsJson:any){
  let ws=vscode.workspace;
    let config=ws.getConfiguration();
    config.update('projectManagerDeepJson.projects.backup',projectsJson,true,undefined);
}
