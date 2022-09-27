import * as vscode from 'vscode';
import { TextDecoder, TextEncoder } from 'util';

import { openWindowNew, openWindowThis } from './MenuManager';

import stripJsonTrailingCommas from "strip-json-trailing-commas";

import { jsonc } from "jsonc";
import { isDataView } from 'util/types';

// https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/testViewDragAndDrop.ts

export class DeepJsonProvider implements vscode.TreeDataProvider<DeepJsonItem>, vscode.TreeDragAndDropController<DeepJsonItem> {
  context: vscode.ExtensionContext;
  projectsState = new Map<string, vscode.TreeItemCollapsibleState>();
  initialized: boolean = false;

  rootItems: DeepJsonItem[] = new Array<DeepJsonItem>();

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    const tv = vscode.window.createTreeView('projectManagerDeepJson', {
      treeDataProvider: this,
      dragAndDropController: this
    });
    tv.onDidChangeSelection((e: vscode.TreeViewSelectionChangeEvent<DeepJsonItem>) => {
      this.onDidChangeSelection(e.selection);
      // tv.reveal(e.selection[0], { focus: false, select: false });
    });
    tv.onDidCollapseElement((e: vscode.TreeViewExpansionEvent<DeepJsonItem>) => {
      this.onDidCollapseElement(e.element);
    });
    tv.onDidExpandElement((e: vscode.TreeViewExpansionEvent<DeepJsonItem>) => {
      this.onDidExpandElement(e.element);
    });

    context.subscriptions.push(tv);
  }
  private _onDidChangeTreeData: vscode.EventEmitter<(DeepJsonItem | undefined)[] | undefined> = new vscode.EventEmitter<DeepJsonItem[] | undefined>();
  // We want to use an array as the event type, but the API for this is currently being finalized. Until it's finalized, use any.
  public onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

  onDidChangeSelection(elem: readonly DeepJsonItem[]) {
    if (elem.length <= 0) { return; }
    const targetItem: DeepJsonItem = elem[0];
    if (typeof targetItem.childrenJsonValue === "string" || Array.isArray(targetItem.childrenJsonValue)) {
      openWindowNew(elem[0]);
    }
  }

  onDidCollapseElement(elem: DeepJsonItem) {
    console.log("onDidCollapse");
    addProjectState(this.context, elem.currentPath, vscode.TreeItemCollapsibleState.Collapsed);
  }
  onDidExpandElement(elem: DeepJsonItem) {
    console.log("onDidExpand");
    addProjectState(this.context, elem.currentPath, vscode.TreeItemCollapsibleState.Expanded);
  }
  getTreeItem(element: DeepJsonItem): DeepJsonItem {
    console.log("getTreeItem");
    return element;
  }

  getParent(element: DeepJsonItem): vscode.ProviderResult<DeepJsonItem> {
    console.log("getParent");

    return element;
  }



  // call initialize and expand
  getChildren(element?: DeepJsonItem): Thenable<DeepJsonItem[]> {
    console.log("getChildren");

    if (element) {
      // this is child position!!
      return Promise.resolve(this.getItems(element));
    } else {
      // this is root position!!
      return Promise.resolve(this.getItems(undefined));
    }
  }

  private async getItems(parentItem: DeepJsonItem | undefined): Promise<DeepJsonItem[]> {
    console.log("getItems");

    // TODO to childItems:DeepJsonItem[];
    let childDict: object;

    if (parentItem === undefined) {
      if (this.rootItems.length > 0) {
        return this.rootItems;
      }
      // get root item!!
      childDict = await getProjectsJson(this.context);
    } else {
      childDict = parentItem.childrenJsonValue;
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
      itemArray.push(new DeepJsonItem(currentPath, state, key, value, parentItem));
    });
    await addProjectStates(this.context, itemArray);
    if (parentItem === undefined) {
      this.rootItems = itemArray;
    }
    return itemArray;
  }

  async loadAndInitializeState(context: vscode.ExtensionContext) {
    const projectStateJson = await getProjectsStateJson(this.context);
    this.projectsState = toMap(projectStateJson);
    await initializeStateJson(context);
  }

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  dropMimeTypes = ['application/vnd.code.tree.deepJsonProvider'];
  dragMimeTypes = ['text/uri-list'];


  handleDrag(source: readonly DeepJsonItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
    console.log("handle drag : " + source[0].currentPath);
    // dataTransfer.set("application/test.pmdj", new vscode.DataTransferItem(source));
    dataTransfer.set("application/vnd.code.tree.deepJsonProvider", new vscode.DataTransferItem(source));

  }
  handleDrop(target: DeepJsonItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
    console.log("handle drop : " + target?.currentPath);
    const transferItem = dataTransfer.get("application/vnd.code.tree.deepJsonProvider");
    if (!transferItem) { return; }
    if (target === undefined) { return; }
    this.editElem(target, transferItem.value);
  }

  editElem(target: DeepJsonItem, source: DeepJsonItem[]) {
    let rootRemove: Boolean = false;
    source.forEach(element => {
      delete element.parent?.childrenJsonValue[element.key];
      if (element.parent === undefined) {
        // reset root json;
        this.rootItems.forEach((root, index, rootItems) => {
          if (element.currentPath === root.currentPath) {
            rootItems.splice(index, 1);
            rootRemove = true;
          }
        });
      }

      target.childrenJsonValue[element.key] = element.childrenJsonValue;
    });
    this.getChildren(target);

    this._onDidChangeTreeData.fire(new Array(target));
    this._onDidChangeTreeData.fire(source);
    if (rootRemove) {
      this._onDidChangeTreeData.fire(undefined);
    }

    // update json
  }

}


function getCurrentPath(parentKey: string, currentKey: string) {
  return parentKey + "." + currentKey;
}


export class DeepJsonItem extends vscode.TreeItem {
  childrenJsonValue: any = undefined;
  currentPath: string;
  state = vscode.TreeItemCollapsibleState.None;
  rootOpenPath: string | undefined;
  parent: DeepJsonItem | undefined;
  constructor(
    currentPath: string,
    state: vscode.TreeItemCollapsibleState,
    public readonly key: string,
    childrenJsonValue: any,
    parent: DeepJsonItem | undefined
  ) {
    super(key, state);
    this.state = state;
    this.currentPath = currentPath;
    this.parent = parent;

    if (typeof childrenJsonValue === "string") {
      this.description = childrenJsonValue;
      this.tooltip = childrenJsonValue;
      this.childrenJsonValue = childrenJsonValue;
      this.setInfo(childrenJsonValue, childrenJsonValue, childrenJsonValue);
    } else if (Array.isArray(childrenJsonValue)) {
      let desc = "";
      childrenJsonValue.forEach((line: string) => {
        desc += line.split("\\").join("/") + "\n";
      });
      this.setInfo(childrenJsonValue, " : " + childrenJsonValue.length + " files", desc);
    } else if (typeof childrenJsonValue === "object") {
      // folder have root
      const sameNameChild = childrenJsonValue[key];
      if (typeof sameNameChild === "string") {
        this.rootOpenPath = childrenJsonValue[key];
        delete childrenJsonValue[key];
        this.setInfo(childrenJsonValue, sameNameChild, sameNameChild);
      } else {
        // folder
        let desc = "";
        const map = toMap(childrenJsonValue);
        map.forEach((value, key) => {
          desc += key + '\n';
        });
        // this.setInfo(value," > "+map.size,desc);
        this.setInfo(childrenJsonValue, undefined, desc);
      }
    } else {
      // ???
      this.setInfo(undefined, undefined, undefined);
    }

    // this.tooltip="tooltip";
    // this.description="description";
  }

  setInfo(value: any, description: string | undefined, tooltip: string | undefined) {
    this.childrenJsonValue = value;
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
  let jsonString = await readFile(uri);
  try {

    jsonString = jsonc.stripComments(jsonString);

    jsonString = stripJsonTrailingCommas(jsonString, { stripWhitespace: true });

    // ],に対応してない対策
    jsonString = replaceZettai(jsonString, "\n ", "\n");
    jsonString = replace(jsonString, "\n", "");
    jsonString = replace(jsonString, "],", "]");
    jsonString = replace(jsonString, "][", "],[");
    jsonString = replace(jsonString, "]\"", "],\"");
    // jsonString=jsonc.uglify(jsonString);

    // const obj: object =jsonc.parse(jsonString);
    // return obj;
    return JSON.parse(jsonString);
  } catch (error) {
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
  value: string
) {
  // if (key === undefined) {
  //   key = await vscode.window.showInputBox();
  // }
  // if (key === undefined) { return; }

  let projectsJson = await getProjectsJson(context);

  let splitValues = value.split("/");
  let key = splitValues[splitValues.length - 1];

  const map = toMap(projectsJson);
  if (map.size <= 0) {
    vscode.window.showInformationMessage("setting file size is 0.");
  } else {
    //backup settings
    backupProject(projectsJson);
  }



  // projectsJson[key] = value;
  await addJsonFileByString(context, "settings", value);
  // await saveJsonFile(context, "settings", projectsJson);
  new DeepJsonProvider(context);
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
  , value: any
) {
  const uri = vscode.Uri.file(context.globalStorageUri.fsPath + "/" + filename + ".jsonc");
  let text = await readFile(uri);
  const enc = new TextEncoder();
  // let addJson: any = {};
  let saveValue: string = replace(value, "\\", "/");
  let splitedValue = saveValue.split("/");
  let key_ = splitedValue[splitedValue.length - 1];
  // addJson[key_] = saveValue;
  let addJsonStr = `"${key_}":"${saveValue}",\n`;
  const lastPlace = text.lastIndexOf('}');
  text = text.substring(0, lastPlace) + addJsonStr + text.substring(lastPlace, text.length);
  // text = formatJsonString(text);
  const uint8Array = enc.encode(text);
  await vscode.workspace.fs.writeFile(uri, uint8Array);
}

function formatJsonString(jsonString: string) {
  jsonString = replace(jsonString, "}\n", "},\n");
  jsonString = replace(jsonString, "]\n", "],\n");
  jsonString = replace(jsonString, "\"\n", "\",\n");
  jsonString = replace(jsonString, "\\", "/");
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

function replace(text: string, before: string, after: string): string {
  return text.split(before).join(after);
}

function replaceZettai(text: string, before: string, after: string): string {
  while (text.indexOf(before) >= 0) {
    text = text.split(before).join(after);
  }
  return text;
}

