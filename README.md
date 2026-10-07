# vscode-project-manager-deep-json

- `vscode-extension/`: VS Code 拡張本体。詳細は [vscode-extension/README.md](vscode-extension/README.md)
- `wpf/`, `reactNative240320/`: 同じ projects.jsonc を別のフロントエンドで扱う実験(2024年4月で停止)
- `.doc/`: 開発メモ

リポジトリのルートを VS Code で開いたまま、F5(Run Extension)やビルドタスクで拡張を開発できる。
テストは `cd vscode-extension && env -u ELECTRON_RUN_AS_NODE npm test`、または `Tasks: Run Task` から `npm: test - vscode-extension`。
