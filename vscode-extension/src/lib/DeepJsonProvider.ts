import * as vscode from 'vscode';

import SettingsProvider from './SettingsProvider';
import { isPlainObject, PROJECTS_FILE_NAME, renameKey } from './Util';

// 文字列: パス、配列: 複数パス、オブジェクト: フォルダ
export type ProjectValue = string | string[] | Record<string, any>;

type Mutator = (projects: Record<string, any>) => boolean | void;

// https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/src/testViewDragAndDrop.ts
export class DeepJsonProvider implements vscode.TreeDataProvider<DeepJsonItem>, vscode.TreeDragAndDropController<DeepJsonItem>, vscode.Disposable {
  private readonly settingsProvider: SettingsProvider;
  private projects: Record<string, any> | undefined;
  private expandStates: Record<string, vscode.TreeItemCollapsibleState> = {};
  private readonly disposables: vscode.Disposable[] = [];

  private readonly _onDidChangeTreeData = new vscode.EventEmitter<DeepJsonItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  readonly dropMimeTypes = ['application/vnd.code.tree.projectManagerDeepJson'];
  readonly dragMimeTypes = ['text/uri-list'];

  constructor(context: vscode.ExtensionContext) {
    this.settingsProvider = new SettingsProvider(context);

    const tv = vscode.window.createTreeView('projectManagerDeepJson', {
      treeDataProvider: this,
      dragAndDropController: this,
    });
    this.disposables.push(
      tv,
      tv.onDidCollapseElement(e => this.settingsProvider.addExpandStates(e.element.currentPath, vscode.TreeItemCollapsibleState.Collapsed)),
      tv.onDidExpandElement(e => this.settingsProvider.addExpandStates(e.element.currentPath, vscode.TreeItemCollapsibleState.Expanded)),
    );

    // 別ウィンドウ(別プロセス)が保存した内容を取り込む。
    // globalStorage はワークスペース外なので RelativePattern で明示的に監視する。
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(context.globalStorageUri, PROJECTS_FILE_NAME));
    this.disposables.push(
      watcher,
      watcher.onDidChange(() => this.refresh()),
      watcher.onDidCreate(() => this.refresh()),
      watcher.onDidDelete(() => this.refresh()),
      vscode.window.onDidChangeWindowState(e => {
        if (e.focused) { this.refresh(); }
      }),
    );
  }

  dispose() {
    vscode.Disposable.from(...this.disposables).dispose();
    this._onDidChangeTreeData.dispose();
  }

  // ディスクから読み直してツリー全体を再描画する
  refresh() {
    this.projects = undefined;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: DeepJsonItem): DeepJsonItem {
    return element;
  }

  getParent(element: DeepJsonItem): DeepJsonItem | undefined {
    return element.parent;
  }

  async getChildren(element?: DeepJsonItem): Promise<DeepJsonItem[]> {
    let childDict: unknown;
    if (element === undefined) {
      if (this.projects === undefined) {
        try {
          this.projects = await this.settingsProvider.readProjects();
          this.expandStates = await this.settingsProvider.readExpandStates();
        } catch (e) {
          vscode.window.showErrorMessage(`Project Manager Deep Json: ${String(e)}`);
          return [];
        }
      }
      childDict = this.projects;
    } else {
      childDict = element.value;
    }
    if (!isPlainObject(childDict)) {
      return [];
    }

    return Object.entries(childDict).map(([key, value]) => {
      const currentPath = element === undefined ? key : `${element.currentPath}.${key}`;
      const state = isPlainObject(value)
        ? (this.expandStates[currentPath] ?? vscode.TreeItemCollapsibleState.Collapsed)
        : vscode.TreeItemCollapsibleState.None;
      return new DeepJsonItem(currentPath, state, key, value, element);
    });
  }

  // 他ウィンドウの変更を上書きしないよう、変更のたびにディスクの最新を読み直してから書く
  async mutate(fn: Mutator): Promise<boolean> {
    let projects: Record<string, any>;
    try {
      projects = await this.settingsProvider.readProjects();
    } catch (e) {
      vscode.window.showErrorMessage(`Project Manager Deep Json: ${String(e)}`);
      return false;
    }
    if (fn(projects) === false) {
      return false;
    }
    await this.settingsProvider.saveProjects(projects);
    this.refresh();
    return true;
  }

  async addProject(uri?: vscode.Uri) {
    await this.settingsProvider.addProject(uri);
    this.refresh();
  }

  renameItem(item: DeepJsonItem, newKey: string) {
    return this.mutate(projects => {
      const parent = resolveParent(projects, item);
      if (parent === undefined || !(item.key in parent)) { return false; }
      if (newKey in parent) {
        vscode.window.showWarningMessage(`"${newKey}" already exists.`);
        return false;
      }
      renameKey(parent, item.key, newKey);
    });
  }

  deleteItem(item: DeepJsonItem) {
    return this.mutate(projects => {
      const parent = resolveParent(projects, item);
      if (parent === undefined || !(item.key in parent)) { return false; }
      delete parent[item.key];
    });
  }

  addChild(item: DeepJsonItem, key: string, value: ProjectValue) {
    return this.mutate(projects => {
      const target = resolve(projects, item.pathKeys);
      if (!isPlainObject(target)) { return false; }
      if (key in target) {
        vscode.window.showWarningMessage(`"${key}" already exists.`);
        return false;
      }
      target[key] = value;
    });
  }

  handleDrag(source: readonly DeepJsonItem[], dataTransfer: vscode.DataTransfer): void {
    dataTransfer.set(this.dropMimeTypes[0], new vscode.DataTransferItem(source.map(s => s.pathKeys)));
  }

  async handleDrop(target: DeepJsonItem | undefined, dataTransfer: vscode.DataTransfer): Promise<void> {
    const transferItem = dataTransfer.get(this.dropMimeTypes[0]);
    if (!transferItem) { return; }
    const sources = transferItem.value as string[][];
    const targetKeys = target?.pathKeys ?? [];

    await this.mutate(projects => {
      let moved = false;
      for (const sourceKeys of sources) {
        const sourceParentKeys = sourceKeys.slice(0, -1);
        const key = sourceKeys[sourceKeys.length - 1];
        // 同じ親の中、または自分自身・自分の子孫へのドロップは無視
        if (sameKeys(sourceParentKeys, targetKeys) || isPrefix(sourceKeys, targetKeys)) { continue; }

        const sourceParent = resolve(projects, sourceParentKeys);
        const targetValue = resolve(projects, targetKeys);
        if (!isPlainObject(sourceParent) || !(key in sourceParent)) { continue; }
        const value = sourceParent[key];

        if (Array.isArray(targetValue) && typeof value === "string") {
          targetValue.push(value);
        } else if (isPlainObject(targetValue)) {
          if (key in targetValue) { continue; }
          targetValue[key] = value;
        } else {
          continue;
        }
        delete sourceParent[key];
        moved = true;
      }
      return moved;
    });
  }
}

function resolve(projects: Record<string, any>, keys: string[]): unknown {
  let cur: unknown = projects;
  for (const key of keys) {
    if (!isPlainObject(cur)) { return undefined; }
    cur = cur[key];
  }
  return cur;
}

function resolveParent(projects: Record<string, any>, item: DeepJsonItem): Record<string, any> | undefined {
  const parent = resolve(projects, item.pathKeys.slice(0, -1));
  return isPlainObject(parent) ? parent : undefined;
}

function sameKeys(a: string[], b: string[]) {
  return a.length === b.length && a.every((k, i) => k === b[i]);
}

function isPrefix(prefix: string[], keys: string[]) {
  return prefix.length <= keys.length && prefix.every((k, i) => k === keys[i]);
}

export class DeepJsonItem extends vscode.TreeItem {
  readonly pathKeys: string[];

  constructor(
    readonly currentPath: string,
    state: vscode.TreeItemCollapsibleState,
    readonly key: string,
    readonly value: ProjectValue,
    readonly parent: DeepJsonItem | undefined,
  ) {
    super(key, state);
    this.pathKeys = parent === undefined ? [key] : [...parent.pathKeys, key];

    if (typeof value === "string") {
      this.description = value;
      this.tooltip = value;
      this.contextValue = "path";
      this.command = { command: "projectManagerDeepJson.openWindowNew", title: "Open", arguments: [this] };
    } else if (Array.isArray(value)) {
      this.description = ` : ${value.length} files`;
      this.tooltip = value.map(line => line.split("\\").join("/")).join("\n");
      this.contextValue = "path";
      this.command = { command: "projectManagerDeepJson.openWindowNew", title: "Open", arguments: [this] };
    } else if (isPlainObject(value)) {
      this.tooltip = Object.keys(value).join("\n");
      this.contextValue = "folder";
    }
  }
}
