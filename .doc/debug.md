https://code.visualstudio.com/api/get-started/your-first-extension

コマンドはリロードしなければ作成されない
## npm test を VS Code 内ターミナルで実行する場合

VS Code のターミナルは `ELECTRON_RUN_AS_NODE` を設定するため、テスト用に落とした `code` が引数を拒否する(`bad option`)。

    env -u ELECTRON_RUN_AS_NODE npm test
