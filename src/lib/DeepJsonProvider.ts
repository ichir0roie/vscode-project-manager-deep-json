import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';

import { openWindowNew,openWindowThis } from './MenuManager';

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
  if(typeof targetItem.value!=="string"){
    return;
  }
  openWindowNew(elem[0]);
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
    let map: Map<string, object>;
    if (parentItem === undefined) {
      // get root item!!
      map = await getProjectsJson(this.context);
    } else {
      map = parentItem.child;
    }
    let itemArray = new Array<DeepJsonItem>();

    if (!this.initialized){// initialize ,map
      await this.loadAndInitializeState(this.context);
      this.initialized=true;
    }

    toMap(map).forEach((value, key) => {
      let state = vscode.TreeItemCollapsibleState.Collapsed;
      if(typeof value==="string"){
        state=vscode.TreeItemCollapsibleState.None;
      }
      try{
        if(key===parentItem?.key){
          return;
        }
      }catch(e){
        return;
      }

      const parentPath = (parentItem === undefined) ? "" : parentItem.currentPath;
      const currentPath = getCurrentPath(parentPath, key);
      if (this.projectsState.has(currentPath)) {
        state = this.projectsState.get(currentPath)===vscode.TreeItemCollapsibleState.Expanded?
          vscode.TreeItemCollapsibleState.Expanded :
          vscode.TreeItemCollapsibleState.Collapsed;
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
  child: any=undefined;
  currentPath: string;
  state=vscode.TreeItemCollapsibleState.None;
  constructor(
    currentPath: string,
    state: vscode.TreeItemCollapsibleState,
    public readonly key: string,
    public readonly value: any
  ) {
    super(key, state);
    this.state=state;
    this.currentPath = currentPath;
    
    let success=false; 
    if (typeof value === "string") {
      this.description = value;
      this.tooltip = value;
      this.child=undefined;
      success=true;
    }
    if(!success){
      try{
        const child=value[key];
        if(typeof child==="string"){
          // this.child=child;
          this.tooltip=child;
          this.description=child;
          this.child=value;
          success=true;
        }
      }catch(e){
        console.log(e);
      }
    }
    //TODO for array multi open
    if(!success){
      this.child = value;
      this.description = undefined;
      this.tooltip = undefined;
    }
    
    // this.tooltip="tooltip";
    // this.description="description";
  }
  get onDidExpandElement(): any {
    console.log("a");
    return;
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
  const json = JSON.parse(dec.decode(value));
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
  return vscode.Uri.file(globalUri.fsPath + "/projects.json");
}
function getProjectsStateUri(context: vscode.ExtensionContext): vscode.Uri {
  const globalUri = context.globalStorageUri;
  return vscode.Uri.file(globalUri.fsPath + "/projectsState.json");
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

  const projectsUri = getProjectsUri(context);
  const enc = new TextEncoder();
  const uint8Array = enc.encode(JSON.stringify(projectsJson, null, 2));
  await vscode.workspace.fs.writeFile(projectsUri, uint8Array);
  create(context);
}


export async function addProjectState(context: vscode.ExtensionContext, key: string, state:vscode.TreeItemCollapsibleState) {
  
  let projectsStateJson = await getProjectsStateJson(context);
  projectsStateJson[key] = state;

  const projectsStateUri = getProjectsStateUri(context);
  const enc = new TextEncoder();
  const uint8Array = enc.encode(JSON.stringify(projectsStateJson, null, 2));
  await vscode.workspace.fs.writeFile(projectsStateUri, uint8Array);
}

async function  addProjectStates(context: vscode.ExtensionContext,items:DeepJsonItem[]) {
  let projectsStateJson = await getProjectsStateJson(context);
  items.forEach((item)=>{
    projectsStateJson[item.currentPath]=item.state;
  });

  const projectsStateUri = getProjectsStateUri(context);
  const enc = new TextEncoder();
  const uint8Array = enc.encode(JSON.stringify(projectsStateJson, null, 2));
  await vscode.workspace.fs.writeFile(projectsStateUri, uint8Array);
}


function backupProject(projectsJson: any) {
  let ws = vscode.workspace;
  let config = ws.getConfiguration();
  config.update('projectManagerDeepJson.projects.backup', projectsJson, true, undefined);
}
