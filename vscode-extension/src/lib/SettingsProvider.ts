import * as vscode from 'vscode';
import { parse, ParseError } from "jsonc-parser";
import { TextDecoder, TextEncoder } from 'util';
import * as util from './Util';

class JsonStore {
    constructor(private readonly dirUri: vscode.Uri) { }

    protected async readJsonc(uri: vscode.Uri): Promise<any> {
        try {
            await vscode.workspace.fs.stat(uri);
        } catch {
            await this.writeJsonc(uri, {});
        }
        const text = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
        if (text.trim() === "") {
            return {};
        }
        const errors: ParseError[] = [];
        const value = parse(text, errors, { allowTrailingComma: true });
        // 保存途中のファイルなど、中身が壊れているときは例外にして呼び出し側で扱う
        if (errors.length > 0 && !util.isPlainObject(value)) {
            throw new Error(`failed to parse ${uri.fsPath}`);
        }
        return value;
    }

    protected async writeJsonc(uri: vscode.Uri, json: any) {
        await vscode.workspace.fs.createDirectory(this.dirUri);
        await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(JSON.stringify(json, null, 2)));
    }
}

export default class SettingsProvider extends JsonStore {
    private readonly projectDictUri: vscode.Uri;
    private readonly expandStatesUri: vscode.Uri;
    private expandStatesQueue: Promise<void> = Promise.resolve();

    constructor(context: vscode.ExtensionContext) {
        super(context.globalStorageUri);
        this.projectDictUri = util.getProjectsJsonUri(context);
        this.expandStatesUri = util.getExpandStateJsonUri(context);
    }

    readProjects(): Promise<any> {
        return this.readJsonc(this.projectDictUri);
    }

    saveProjects(projects: any): Promise<void> {
        return this.writeJsonc(this.projectDictUri, projects);
    }

    async addProject(uri: vscode.Uri | undefined = undefined) {
        let filePath = uri === undefined ? util.getRootPath() : uri.fsPath;
        if (filePath === undefined) {
            return;
        }
        if (process.platform === "win32") {
            filePath = filePath.split("\\").join("/");
        }
        const projects = await this.readProjects();
        const key = filePath.split("/").pop() || filePath;
        projects[key] = filePath;
        await this.saveProjects(projects);
    }

    readExpandStates(): Promise<any> {
        return this.readJsonc(this.expandStatesUri);
    }

    // 複数の開閉イベントが続いても読み書きが競合しないよう直列化する
    addExpandStates(key: string, state: vscode.TreeItemCollapsibleState): Promise<void> {
        this.expandStatesQueue = this.expandStatesQueue.then(async () => {
            try {
                const expandStates = await this.readExpandStates();
                expandStates[key] = state;
                await this.writeJsonc(this.expandStatesUri, expandStates);
            } catch (e) {
                console.error(e);
            }
        });
        return this.expandStatesQueue;
    }
}
