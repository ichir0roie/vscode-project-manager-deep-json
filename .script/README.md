# Migrating from Project Manager

`transfer_PM_to_DJ.py` converts the project list of the
[Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager)
extension (`alefragnani.project-manager`) into the format used by Project Manager Deep Json.

## Steps

1. In VS Code, run the command "Project Manager: Edit Projects" and save that file as `input.json` next to this script.
   It is a list of objects with `name` and `rootPath`.
2. Run the script:

   ```sh
   python3 transfer_PM_to_DJ.py
   ```

   It writes `output.json`, with every project under one group named `temp`.
3. In Project Manager Deep Json, click "Open Projects Json File" and paste the contents of `output.json` into `projects.jsonc`.
   Rename or move the `temp` group as you like.

## 日本語

Project Manager 拡張機能 (alefragnani.project-manager) の `projects.json` を、この拡張機能の形式に変換するスクリプトです。

1. VS Code で "Project Manager: Edit Projects" を実行し、開いたファイルをこのスクリプトと同じ場所に `input.json` として保存する。
2. `python3 transfer_PM_to_DJ.py` を実行すると `output.json` ができる。すべてのプロジェクトは `temp` グループの下に入る。
3. "Open Projects Json File" で `projects.jsonc` を開き、`output.json` の内容を貼り付ける。`temp` の名前や位置は自由に変えてよい。
