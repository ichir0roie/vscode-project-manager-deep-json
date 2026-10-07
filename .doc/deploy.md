# デプロイ

## 自動(通常はこちら)

main に push されると [.github/workflows/publish.yml](../.github/workflows/publish.yml) が走る。

1. lint とテストを実行
2. `package.json` の `version` に対応するタグ `v<version>` が無ければ Marketplace に publish してタグを打つ
3. タグがあれば何もしない

つまりリリース手順は「`package.json` の version を上げて CHANGELOG を書いて main にマージ」だけ。

必要な secret: リポジトリの Settings → Secrets and variables → Actions に `VSCE_PAT`。
値は Azure DevOps の Personal Access Token(Organization: All accessible organizations、Scope: Marketplace → Manage)。
有効期限は最長 1 年なので、publish ジョブが 401 で落ちたら作り直して secret を更新する。

## 手動

```bash
npm run package                        # vsix を作る(ローカルで試すとき)
code --install-extension *.vsix

npx vsce login ichir0roie              # PAT を聞かれる(初回だけ)
npm run publish                        # Marketplace に公開
```

## 注意

- VS Code 内ターミナルで `npm test` を回すときは `env -u ELECTRON_RUN_AS_NODE npm test`
- vsix に入るファイルは `npx vsce ls` で確認できる。除外は [.vscodeignore](../.vscodeignore)
