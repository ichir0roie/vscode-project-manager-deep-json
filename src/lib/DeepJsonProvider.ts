import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { json } from 'stream/consumers';

export class DeepJsonProvider implements vscode.TreeDataProvider<DeepJsonItem> {

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
  private getRootItems(): DeepJsonItem[] {
    // get root item!!
      const packageJson = getTemplateMapConfiguration();
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

class DeepJsonItem extends vscode.TreeItem {
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
    }else{
      this.description=undefined;
    }
    this.tooltip = undefined;
    this.child=value;
  }
}

function toJson(object:object):any{
  const jsonString=JSON.stringify(object);
  const jsonObject=JSON.parse(jsonString);
  return jsonObject;
}

function toMap(jsonObject:any):Map<string,any>{
  return new Map<string,any>(Object.entries(jsonObject));
}

function getTemplateMapConfiguration():any{
	let templateMap=new Map<string,string>();

	let ws=vscode.workspace;
	let config=ws.getConfiguration();
	const projects:any=config.get('projects');
  return toJson(projects);
}
