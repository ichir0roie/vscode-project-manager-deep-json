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
    console.log("onDidCollapse");
    this.settingsProvider.addExpandStates(elem.currentPath, vscode.TreeItemCollapsibleState.Collapsed);
  }
  onDidExpandElement(elem: DeepJsonItem) {
    console.log("onDidExpand");
    this.settingsProvider.addExpandStates(elem.currentPath, vscode.TreeItemCollapsibleState.Expanded);
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

    let childDict: any;

    if (parentItem === undefined) {
      // if (this.rootItems.length > 0) {
      //   return this.rootItems;
      // }

      // get root item!!
      await this.initializeSettings();
      childDict = this.projects;
    } else {
      childDict = parentItem.childrenJsonValue;
    }
    let itemArray = new Array<DeepJsonItem>();

    for (const key in childDict) {
      const value = childDict[key];

      let state = vscode.TreeItemCollapsibleState.Collapsed;
      const parentPath = (parentItem === undefined) ? "" : parentItem.currentPath;
      const currentPath = getCurrentPath(parentPath, key);
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
      // if (element.parent === undefined) {
      //   // reset root json;
      //   this.rootItems.forEach((root, index, rootItems) => {
      //     if (element.currentPath === root.currentPath) {
      //       rootItems.splice(index, 1);
      //       rootRemove = true;
      //     }
      //   });
      // }

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
        for (key in childrenJsonValue) {
          const value = childrenJsonValue[key];
          desc += key + '\n';
        }
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
