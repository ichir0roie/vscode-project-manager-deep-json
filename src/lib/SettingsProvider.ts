
import * as vscode from 'vscode';
import { jsonc } from "jsonc";
import * as util from './Util';
import stripJsonTrailingCommas from "strip-json-trailing-commas";
import { TextDecoder, TextEncoder } from 'util';
import { DeepJsonItem } from './DeepJsonProvider';

class JsonProvider {

    // base method
    private async readFile(uri: vscode.Uri): Promise<string> {
        const value = await vscode.workspace.fs.readFile(uri);
        const dec = new TextDecoder();
        return dec.decode(value);
    }

    protected async readJsonc(uri: vscode.Uri): Promise<any> {
        let stat;
        try {
            stat = await vscode.workspace.fs.stat(uri);
        } catch (e) {
            await this.writeFile(uri, '{}');
        }
        let jsonString = await this.readFile(uri);
        try {

            jsonString = jsonc.stripComments(jsonString);

            jsonString = stripJsonTrailingCommas(jsonString, { stripWhitespace: true });

            // ],に対応してない対策
            jsonString = util.replaceZettai(jsonString, "\n ", "\n");
            jsonString = util.replace(jsonString, "\n", "");
            jsonString = util.replace(jsonString, "],", "]");
            jsonString = util.replace(jsonString, "][", "],[");
            jsonString = util.replace(jsonString, "]\"", "],\"");
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


    private async writeFile(uri: vscode.Uri, text: string) {
        const enc = new TextEncoder();
        const uint8Array = enc.encode(text);
        await vscode.workspace.fs.writeFile(uri, uint8Array);
    }
    protected async writeJsonc(uri: vscode.Uri, json: any) {
        await this.writeFile(uri, JSON.stringify(json, null, 2));
    }


}

export default class SettingsProvider extends JsonProvider {
    protected context: vscode.ExtensionContext;
    private projectDictUri: vscode.Uri;
    private expandStatesUri: vscode.Uri;


    constructor(context: vscode.ExtensionContext) {
        super();
        this.context = context;
        this.projectDictUri = util.getProjectsJsonUri(context);
        this.expandStatesUri = util.getExpandStateJsonUri(context);

    }


    async readProjects(): Promise<any> {
        return await this.readJsonc(this.projectDictUri);
    }

    async saveProjects(projects: any) {
        await this.writeJsonc(this.projectDictUri, projects);
    }
    async addProject() {
        let filePath = util.getRootPath();
        if (filePath === undefined) {
            return;
        }
        filePath = util.replaceZettai(filePath, "\\", "/");
        let projects = await this.readProjects();

        let splitValues = filePath.split("/");
        let key = splitValues[splitValues.length - 1];

        if (Object.keys(projects).length <= 0) {
            vscode.window.showInformationMessage("setting file size is 0.");
        }
        //TODO projects[""] = filePath;
        projects[key] = filePath;
        await this.saveProjects(projects);
    }


    async saveExpandStates(expandStates: any) {
        await this.writeJsonc(this.expandStatesUri, expandStates);
    }

    async readExpandStates(): Promise<any> {

        try {
            await vscode.workspace.fs.stat(this.expandStatesUri);
        } catch (e) {
            await this.writeJsonc(this.expandStatesUri, {});
        }

        return await this.readJsonc(this.expandStatesUri);
    }

    async addExpandStates(key: string, state: vscode.TreeItemCollapsibleState) {
        let expandStates = await this.readExpandStates();
        expandStates[key] = state;
        this.saveExpandStates(expandStates);
    }

    async initializeExpandStates(treeItemArray: Array<DeepJsonItem>) {
        // let expandStates = await this.readExpandStates();
        let expandStates: any = {};
        treeItemArray.forEach((item) => {
            expandStates[item.currentPath] = item.collapsibleState;
        });
        this.saveExpandStates(expandStates);
    }


    // backupProject(projectsJson: any) {
    //     let ws = vscode.workspace;
    //     let config = ws.getConfiguration();
    //     config.update('projectManagerDeepJson.projects.backup', projectsJson, true, undefined);
    // }


}
