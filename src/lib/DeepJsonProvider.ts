import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';

import { openWindowNew,openWindowThis } from './MenuManager';

import stripJsonTrailingCommas from "strip-json-trailing-commas";

export function register(context: vscode.ExtensionContext) {
  let disp = vscode.window.registerTreeDataProvider(
    'projectManagerDeepJson',
    new DeepJsonProvider(context)
  );
  context.subscriptions.push(disp);
  create(context);
}

export function create(context: vscode.ExtensionContext) {
  let tv = vscode.window.createTreeView('projectManagerDeepJson', {
    treeDataProvider: new DeepJsonProvider(context)
  });
  tv.onDidChangeSelection((e: vscode.TreeViewSelectionChangeEvent<DeepJsonItem>) => {
    onDidChangeSelection(context, e.selection);
  });
  tv.onDidCollapseElement((e: vscode.TreeViewExpansionEvent<DeepJsonItem>) => {
    onDidCollapseElement(context, e.element);
  });
  tv.onDidExpandElement((e: vscode.TreeViewExpansionEvent<DeepJsonItem>) => {
    onDidExpandElement(context, e.element);
  });
}

function onDidChangeSelection(context: vscode.ExtensionContext, elem: readonly DeepJsonItem[]) {
  if(elem.length<=0){return;}
  const targetItem:DeepJsonItem=elem[0];
  if(typeof targetItem.value==="string"||Array.isArray(targetItem.value)){
    openWindowNew(elem[0]);
  }
}


function onDidCollapseElement(context: vscode.ExtensionContext, elem: DeepJsonItem) {
  addProjectState(context,elem.currentPath, vscode.TreeItemCollapsibleState.Collapsed);
}
function onDidExpandElement(context: vscode.ExtensionContext, elem: DeepJsonItem) {
  addProjectState(context, elem.currentPath, vscode.TreeItemCollapsibleState.Expanded);
}


export class DeepJsonProvider implements vscode.TreeDataProvider<DeepJsonItem> {
  context: vscode.ExtensionContext;
  projectsState=new Map<string,vscode.TreeItemCollapsibleState>();
  initialized:boolean=false;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }
  
  getTreeItem(element: DeepJsonItem): vscode.TreeItem {
    return element;
  }

  // call initialize and expand
  getChildren(element?: DeepJsonItem): Thenable<DeepJsonItem[]> {
    if (element) {
      // this is child position!!
      return Promise.resolve(this.getItems(element));
    } else {
      // this is root position!!
      return Promise.resolve(this.getItems(undefined));
    }
  }

  private async getItems(parentItem: DeepJsonItem | undefined): Promise<DeepJsonItem[]> {
    let childDict: object;
    if (parentItem === undefined) {
      // get root item!!
      childDict = await getProjectsJson(this.context);
    } else {
      childDict = parentItem.value;
    }
    let itemArray = new Array<DeepJsonItem>();

    if (!this.initialized){// initialize ,map
      await this.loadAndInitializeState(this.context);
      this.initialized=true;
    }

    toMap(childDict).forEach((value, key) => {
      let state = vscode.TreeItemCollapsibleState.Collapsed;
      const parentPath = (parentItem === undefined) ? "" : parentItem.currentPath;
      const currentPath = getCurrentPath(parentPath, key);
      if(typeof value==="string"||Array.isArray(value)){
        state=vscode.TreeItemCollapsibleState.None;
      }else{
        if (this.projectsState.has(currentPath)) {
          const stateStr=this.projectsState.get(currentPath);
          state=stateStr?stateStr:vscode.TreeItemCollapsibleState.None;
        }
      }
      itemArray.push(new DeepJsonItem(currentPath, state, key, value));
    });
    await addProjectStates(this.context,itemArray);
    return itemArray;
  }

  async loadAndInitializeState(context: vscode.ExtensionContext){
    const projectStateJson= await getProjectsStateJson(this.context);
    this.projectsState = toMap(projectStateJson);
    await initializeStateJson(context);
  }
}

function getCurrentPath(parentKey: string, currentKey: string) {
  return parentKey + "." + currentKey;
}


export class DeepJsonItem extends vscode.TreeItem {
  value: any=undefined;
  currentPath: string;
  state=vscode.TreeItemCollapsibleState.None;
  constructor(
    currentPath: string,
    state: vscode.TreeItemCollapsibleState,
    public readonly key: string,
    value: any
  ) {
    super(key, state);
    this.state=state;
    this.currentPath = currentPath;
    
    if (typeof value === "string") {
      this.description = value;
      this.tooltip = value;
      this.value=value;
      this.setInfo(value,value,value);
    }else if(Array.isArray(value)){
      let desc="";
      value.forEach((line:string)=>{
        desc+=line.split("\\").join("/")+"\n";
      });
      this.setInfo(value," : "+value.length+" files",desc);
    }else if(typeof value==="object"){
      // folder have root
      const sameNameChild=value[key];
      if(typeof sameNameChild==="string"){
        delete value[key];
        this.setInfo(value,sameNameChild,sameNameChild);
      }else{
        // folder
        let desc="";
        const map=toMap(value);
        map.forEach((value,key)=>{
          desc+=key+'\n';
        });
        // this.setInfo(value," > "+map.size,desc);
        this.setInfo(value,undefined,desc);
      }
    }else{
      // ???
      this.setInfo(undefined,undefined,undefined);
    }
    
    // this.tooltip="tooltip";
    // this.description="description";
  }

  setInfo(value:any,description:string|undefined,tooltip:string|undefined){
    this.value=value;
    this.description=description;
    this.tooltip=tooltip;
  }
}


function toMap(jsonObject: any): Map<string, any> {
  return new Map<string, any>(Object.entries(jsonObject));
}


async function getProjectsJson(context: vscode.ExtensionContext): Promise<any> {
  const projectsUri = getProjectsUri(context);

  let stat;
  try {
    stat = await vscode.workspace.fs.stat(projectsUri);
  } catch (e) {
    const enc = new TextEncoder();
    await vscode.workspace.fs.writeFile(projectsUri, enc.encode("{}"));
  }

  const value = await vscode.workspace.fs.readFile(projectsUri);

  const dec = new TextDecoder();
  let jsonStr=dec.decode(value);
  jsonStr=stripJsonTrailingCommas(jsonStr,{stripWhitespace:true});
  const json = JSON.parse(jsonStr);
  return json;
}

async function getProjectsStateJson(context: vscode.ExtensionContext): Promise<any> {
  const stateUri = getProjectsStateUri(context);

  try {
    await vscode.workspace.fs.stat(stateUri);
  } catch (e) {
    const enc = new TextEncoder();
    await vscode.workspace.fs.writeFile(stateUri, enc.encode("{}"));
  }

  const value = await vscode.workspace.fs.readFile(stateUri);

  const dec = new TextDecoder();
  const json = JSON.parse(dec.decode(value));
  return json;
}

async function initializeStateJson(context: vscode.ExtensionContext) {
  const stateUri = getProjectsStateUri(context);
  const enc = new TextEncoder();
  await vscode.workspace.fs.writeFile(stateUri, enc.encode("{}"));
}


function getProjectsUri(context: vscode.ExtensionContext): vscode.Uri {
  const globalUri = context.globalStorageUri;
  return vscode.Uri.file(globalUri.fsPath + "/settings.jsonc");
}
function getProjectsStateUri(context: vscode.ExtensionContext): vscode.Uri {
  const globalUri = context.globalStorageUri;
  return vscode.Uri.file(globalUri.fsPath + "/projectsState.jsonc");
}

export function openProjectsSettings(context: vscode.ExtensionContext) {
  const projectsUri = getProjectsUri(context);
  vscode.window.showTextDocument(projectsUri);
}

export async function addProject(context: vscode.ExtensionContext, key: string | undefined, value: string) {
  if (key === undefined) {
    key = await vscode.window.showInputBox();
  }
  if (key === undefined) { return; }

  let projectsJson = await getProjectsJson(context);

  const map = toMap(projectsJson);
  if (map.size <= 0) {
    vscode.window.showInformationMessage("setting file size is 0.");
  } else {
    //backup settings
    backupProject(projectsJson);
  }

  projectsJson[key] = value;

  await saveJsonFile(context,"settings",projectsJson);
  create(context);
}


export async function addProjectState(context: vscode.ExtensionContext, key: string, state:vscode.TreeItemCollapsibleState) {
  
  let projectsStateJson = await getProjectsStateJson(context);
  projectsStateJson[key] = state;

  await saveJsonFile(context,"projectsState",projectsStateJson);
}

async function  addProjectStates(context: vscode.ExtensionContext,items:DeepJsonItem[]) {
  let projectsStateJson = await getProjectsStateJson(context);
  items.forEach((item)=>{
    projectsStateJson[item.currentPath]=item.state;
  });

  await saveJsonFile(context,"projectsState",projectsStateJson);
}

async function saveJsonFile(context:vscode.ExtensionContext,filename:string,json:any) {
  const uri= vscode.Uri.file(context.globalStorageUri.fsPath +"/"+ filename+".jsonc");
  const enc = new TextEncoder();
  let jsonStr=JSON.stringify(json, null, 2).split("\\").join("/").split("//").join("/");
  if(filename==="settings"){
    jsonStr=jsonStr.split("}\n").join("},\n");
    jsonStr=jsonStr.split("]\n").join("],\n");
    jsonStr=jsonStr.split("\"\n").join("\",\n");
  }
  const uint8Array = enc.encode(jsonStr);
  await vscode.workspace.fs.writeFile(uri, uint8Array);
}

export async function formatProjectSettingJson(context:vscode.ExtensionContext) {
  const json=await getProjectsJson(context);
  await saveJsonFile(context,"settings",json);
}

function backupProject(projectsJson: any) {
  let ws = vscode.workspace;
  let config = ws.getConfiguration();
  config.update('projectManagerDeepJson.projects.backup', projectsJson, true, undefined);
}
