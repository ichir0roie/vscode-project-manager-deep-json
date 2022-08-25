import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';

import { openWindowNew, openWindowThis } from './MenuManager';

import stripJsonTrailingCommas from "strip-json-trailing-commas";

import { jsonc } from "jsonc";
import { json } from 'stream/consumers';

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
  if (elem.length <= 0) { return; }
  const targetItem: DeepJsonItem = elem[0];
  if (typeof targetItem.value === "string" || Array.isArray(targetItem.value)) {
    openWindowNew(elem[0]);
  }
}


function onDidCollapseElement(context: vscode.ExtensionContext, elem: DeepJsonItem) {
  addProjectState(context, elem.currentPath, vscode.TreeItemCollapsibleState.Collapsed);
}
function onDidExpandElement(context: vscode.ExtensionContext, elem: DeepJsonItem) {
  addProjectState(context, elem.currentPath, vscode.TreeItemCollapsibleState.Expanded);
}


export class DeepJsonProvider implements vscode.TreeDataProvider<DeepJsonItem> {
  context: vscode.ExtensionContext;
  projectsState = new Map<string, vscode.TreeItemCollapsibleState>();
  initialized: boolean = false;
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

    if (!this.initialized) {// initialize ,map
      await this.loadAndInitializeState(this.context);
      this.initialized = true;
    }

    toMap(childDict).forEach((value, key) => {
      let state = vscode.TreeItemCollapsibleState.Collapsed;
      const parentPath = (parentItem === undefined) ? "" : parentItem.currentPath;
      const currentPath = getCurrentPath(parentPath, key);
      if (typeof value === "string" || Array.isArray(value)) {
        state = vscode.TreeItemCollapsibleState.None;
      } else {
        if (this.projectsState.has(currentPath)) {
          const stateStr = this.projectsState.get(currentPath);
          state = stateStr ? stateStr : vscode.TreeItemCollapsibleState.None;
        }
      }
      itemArray.push(new DeepJsonItem(currentPath, state, key, value));
    });
    await addProjectStates(this.context, itemArray);
    return itemArray;
  }

  async loadAndInitializeState(context: vscode.ExtensionContext) {
    const projectStateJson = await getProjectsStateJson(this.context);
    this.projectsState = toMap(projectStateJson);
    await initializeStateJson(context);
  }
}

function getCurrentPath(parentKey: string, currentKey: string) {
  return parentKey + "." + currentKey;
}


export class DeepJsonItem extends vscode.TreeItem {
  value: any = undefined;
  currentPath: string;
  state = vscode.TreeItemCollapsibleState.None;
  rootOpenPath: string | undefined;
  constructor(
    currentPath: string,
    state: vscode.TreeItemCollapsibleState,
    public readonly key: string,
    value: any
  ) {
    super(key, state);
    this.state = state;
    this.currentPath = currentPath;

    if (typeof value === "string") {
      this.description = value;
      this.tooltip = value;
      this.value = value;
      this.setInfo(value, value, value);
    } else if (Array.isArray(value)) {
      let desc = "";
      value.forEach((line: string) => {
        desc += line.split("\\").join("/") + "\n";
      });
      this.setInfo(value, " : " + value.length + " files", desc);
    } else if (typeof value === "object") {
      // folder have root
      const sameNameChild = value[key];
      if (typeof sameNameChild === "string") {
        this.rootOpenPath = value[key];
        delete value[key];
        this.setInfo(value, sameNameChild, sameNameChild);
      } else {
        // folder
        let desc = "";
        const map = toMap(value);
        map.forEach((value, key) => {
          desc += key + '\n';
        });
        // this.setInfo(value," > "+map.size,desc);
        this.setInfo(value, undefined, desc);
      }
    } else {
      // ???
      this.setInfo(undefined, undefined, undefined);
    }

    // this.tooltip="tooltip";
    // this.description="description";
  }

  setInfo(value: any, description: string | undefined, tooltip: string | undefined) {
    this.value = value;
    this.description = description;
    this.tooltip = tooltip;
  }
}


function toMap(jsonObject: any): Map<string, any> {
  return new Map<string, any>(Object.entries(jsonObject));
}

// XXX 読み書き系のコードが汚い！！！！

// base method
async function readFile(uri: vscode.Uri): Promise<string> {
  const value = await vscode.workspace.fs.readFile(uri);
  const dec = new TextDecoder();
  return dec.decode(value);
}
async function readJson(uri: vscode.Uri): Promise<object> {
  let stat;
  try {
    stat = await vscode.workspace.fs.stat(uri);
  } catch (e) {
    writeFile(uri, '{}');
  }
  let jsonString=await readFile(uri);
  try{

    jsonString=jsonc.stripComments(jsonString);
    
    jsonString = stripJsonTrailingCommas(jsonString, { stripWhitespace: true });

    // ],に対応してない対策
    jsonString=replace(jsonString,"\n","");
    jsonString=replace(jsonString," ","");
    jsonString=replace(jsonString,"],","]");
    jsonString=replace(jsonString,"][","],[");
    jsonString=replace(jsonString,"]\"","],\"");
    // jsonString=jsonc.uglify(jsonString);
    
    // const obj: object =jsonc.parse(jsonString);
    // return obj;
  return JSON.parse(jsonString);
  }catch(error){
    console.log(error);
    console.log(jsonString);
    throw error;
  }
}

async function writeFile(uri: vscode.Uri, text: string) {
  const enc = new TextEncoder();
  const uint8Array = enc.encode(text);
  await vscode.workspace.fs.writeFile(uri, uint8Array);
}
async function writeJson(uri: vscode.Uri, json: any) {
  await writeFile(uri, JSON.stringify(json, null, 2));
}

async function getProjectsJson(context: vscode.ExtensionContext): Promise<any> {
  const projectsUri = getProjectsUri(context);
  return await readJson(projectsUri);
}


async function getProjectsStateJson(context: vscode.ExtensionContext): Promise<any> {
  const stateUri = getProjectsStateUri(context);

  try {
    await vscode.workspace.fs.stat(stateUri);
  } catch (e) {
    await writeFile(stateUri, '{}');
  }

  return await readJson(stateUri);
}


async function initializeStateJson(context: vscode.ExtensionContext) {
  const stateUri = getProjectsStateUri(context);
  await writeFile(stateUri, '{}');
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

export async function addProject(
  context: vscode.ExtensionContext,
  key: string | undefined,
  value: string
) {
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

  // projectsJson[key] = value;
  await addJsonFileByString(context, "settings", key, value);
  // await saveJsonFile(context, "settings", projectsJson);
  create(context);
}


export async function addProjectState(context: vscode.ExtensionContext, key: string, state: vscode.TreeItemCollapsibleState) {

  let projectsStateJson = await getProjectsStateJson(context);
  projectsStateJson[key] = state;

  await saveJsonFile(context, "projectsState", projectsStateJson);
}

async function addProjectStates(context: vscode.ExtensionContext, items: DeepJsonItem[]) {
  let projectsStateJson = await getProjectsStateJson(context);
  items.forEach((item) => {
    projectsStateJson[item.currentPath] = item.state;
  });

  await saveJsonFile(context, "projectsState", projectsStateJson);
}

async function saveJsonFile(context: vscode.ExtensionContext, filename: string, json: any) {
  const uri = vscode.Uri.file(context.globalStorageUri.fsPath + "/" + filename + ".jsonc");
  await writeJson(uri, json);
}


async function addJsonFileByString(
  context: vscode.ExtensionContext
  , filename: string
  , key_: string
  , value: any
) {
  const uri = vscode.Uri.file(context.globalStorageUri.fsPath + "/" + filename + ".jsonc");
  let text = await readFile(uri);
  const enc = new TextEncoder();
  let addJson: any = {};
  addJson[key_] = value;
  let addJsonStr = `"${key_}":"${value}",\n`;
  const lastPlace = text.lastIndexOf('}');
  text = text.substring(0, lastPlace) + addJsonStr + text.substring(lastPlace, text.length);
  // text = formatJsonString(text);
  const uint8Array = enc.encode(text);
  await vscode.workspace.fs.writeFile(uri, uint8Array);
}

function formatJsonString(jsonString: string) {
  // jsonString = jsonString.split("}\n").join("},\n");
  // jsonString = jsonString.split("]\n").join("],\n");
  // jsonString = jsonString.split("\"\n").join("\",\n");
  // jsonString = jsonString.split("\\").join("/");
  jsonString=replace(jsonString,"}\n","},\n");
  jsonString=replace(jsonString,"]\n","],\n");
  jsonString=replace(jsonString,"\"\n","\",\n");
  jsonString=replace(jsonString,"\\","/");
  return jsonString;
}

export async function formatProjectSettingJson(context: vscode.ExtensionContext) {
  const uri = getProjectsUri(context);
  let text = await readFile(uri);
  text = formatJsonString(text);
  await writeFile(uri, text);
}

function backupProject(projectsJson: any) {
  let ws = vscode.workspace;
  let config = ws.getConfiguration();
  config.update('projectManagerDeepJson.projects.backup', projectsJson, true, undefined);
}

function replace(text:string,before:string,after:string):string{
  return text.split(before).join(after);
}

