import { isAnyArrayBuffer } from 'util/types';
import * as vscode from 'vscode';

import { openWindowNew, openWindowThis } from './Action';
import SettingsProvider from './SettingsProvider';



// https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/testViewDragAndDrop.ts

export class DeepJsonProvider implements vscode.TreeDataProvider<DeepJsonItem>, vscode.TreeDragAndDropController<DeepJsonItem> {
  context: vscode.ExtensionContext;

  settingsProvider: SettingsProvider;
  projects: any;
  expandStates: any;

  // TODO 閉じるときに、settingsの全更新。

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.settingsProvider = new SettingsProvider(context);
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
    this.settingsProvider.addExpandStates(elem.currentPath, vscode.TreeItemCollapsibleState.Collapsed);
  }
  onDidExpandElement(elem: DeepJsonItem) {
    this.settingsProvider.addExpandStates(elem.currentPath, vscode.TreeItemCollapsibleState.Expanded);
  }
  getTreeItem(element: DeepJsonItem): DeepJsonItem {
    return element;
  }

  getParent(element: DeepJsonItem): vscode.ProviderResult<DeepJsonItem> {

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

    let childDict: any;

    if (parentItem === undefined) {
      // if (this.rootItems.length > 0) {
      //   return this.rootItems;
      // }

      // get root item!!
      if (this.projects === undefined) {
        await this.initializeSettings();
      }
      childDict = this.projects;
    } else {
      childDict = parentItem.childrenJsonValue;
    }
    let itemArray = new Array<DeepJsonItem>();

    for (const key in childDict) {
      const value = childDict[key];

      let state = vscode.TreeItemCollapsibleState.Collapsed;
      const parentPath = (parentItem === undefined) ? undefined : parentItem.currentPath;
      const currentPath = this.getCurrentPath(parentPath, key);
      if (typeof value === "string" || Array.isArray(value)) {
        state = vscode.TreeItemCollapsibleState.None;
      } else {
        if (this.expandStates[currentPath]) {
          const stateStr = this.expandStates[currentPath];
          state = stateStr ? stateStr : vscode.TreeItemCollapsibleState.None;
        }
      }
      itemArray.push(new DeepJsonItem(currentPath, state, key, value, parentItem));
    }

    return itemArray;
  }

  private async initializeSettings() {
    this.projects = await this.settingsProvider.readProjects();
    this.expandStates = await this.settingsProvider.readExpandStates();
  }

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types
  dropMimeTypes = ['application/tree.deepJsonProvider'];
  dragMimeTypes = ['text/uri-list'];


  handleDrag(source: readonly DeepJsonItem[], dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
    // dataTransfer.set("application/test.pmdj", new vscode.DataTransferItem(source));
    dataTransfer.set("application/tree.deepJsonProvider", new vscode.DataTransferItem(source));

  }
  handleDrop(target: DeepJsonItem | undefined, dataTransfer: vscode.DataTransfer, token: vscode.CancellationToken): void | Thenable<void> {
    const transferItem = dataTransfer.get("application/tree.deepJsonProvider");
    if (!transferItem) { return; }
    const moved = this.editElem(target, transferItem.value);
    if (moved) {
      this.saveProjects();
    }
  }

  editElem(target: DeepJsonItem | undefined, source: DeepJsonItem[]): boolean {
    let rootRemove: boolean = false;
    let fireTarget = new Array<DeepJsonItem | undefined>();
    source.forEach(dragItem => {

      if (target === undefined && dragItem.parent === undefined) {
        return;
      } else if (target === undefined) {
        this.projects[dragItem.key] = dragItem.childrenJsonValue;
      } else if (Array.isArray(target.childrenJsonValue) && typeof dragItem.childrenJsonValue === "string") {
        target.childrenJsonValue.push(dragItem.childrenJsonValue);
      } else if (typeof target.childrenJsonValue === "object") {
        target.childrenJsonValue[dragItem.key] = dragItem.childrenJsonValue;
      } else {
        return;
      }

      // delete dragItem
      if (dragItem.parent !== undefined) {
        fireTarget.push(dragItem.parent);
        delete dragItem.parent?.childrenJsonValue[dragItem.key];
      } else {// root item
        if (this.projects[dragItem.key]) {
          delete this.projects[dragItem.key];
          rootRemove = true;
        }
      }
    });
    if (rootRemove) {
      fireTarget.push(undefined);
    }
    if (fireTarget.length <= 0) {
      return false;
    }

    fireTarget.push(target);

    this._onDidChangeTreeData.fire(fireTarget);

    return true;
  }

  private getCurrentPath(parentKey: string | undefined, currentKey: string) {
    if (parentKey === undefined) {
      return currentKey;
    } else {
      return parentKey + "." + currentKey;
    }
  }

  public async addProject() {
    await this.settingsProvider.addProject();
    this.projects = undefined;
    this.refreshTreeItem(undefined);
  }

  public saveProjects() {
    this.settingsProvider.saveProjects(this.projects);
  }
  private refreshTreeItem(treeItem: DeepJsonItem | undefined) {
    this.getChildren(treeItem);
    this._onDidChangeTreeData.fire(new Array(treeItem));
  }

  // TODO use
  public deleteItem(treeItem: DeepJsonItem) {
    let parent = treeItem.parent;
    if (parent === undefined) {
      delete this.projects[treeItem.key];
    } else {
      delete parent?.childrenJsonValue[treeItem.key];
    }
    this.refreshTreeItem(treeItem);
  }



  private addList(treeItem: DeepJsonItem) {
    // if (typeof treeItem.childrenJsonValue === "string") {
    // } else if (typeof treeItem.childrenJsonValue === "object") {
    // } else if (Array.isArray(treeItem.childrenJsonValue)){
    // }
    if (typeof treeItem.childrenJsonValue === "object") {
      treeItem.childrenJsonValue[""] = [];
    }
  }

  // TODO paste path to add project

  // TODO copy path and add project form meny

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
      this.setInfo(childrenJsonValue, childrenJsonValue, childrenJsonValue);
    } else if (Array.isArray(childrenJsonValue)) {
      let desc = "";
      childrenJsonValue.forEach((line: string) => {
        desc += line.split("\\").join("/") + "\n";
      });
      this.setInfo(childrenJsonValue, " : " + childrenJsonValue.length + " files", desc);
    } else if (typeof childrenJsonValue === "object") {
      // folder have root

      // folder
      let desc = "";
      for (key in childrenJsonValue) {
        const value = childrenJsonValue[key];
        desc += key + '\n';
      }
      // this.setInfo(value," > "+map.size,desc);
      this.setInfo(childrenJsonValue, undefined, desc);
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
