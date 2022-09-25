# 要件

ドラッグアンドドロップで、設定を移動できるようにする。


## 基本設計

各アイテムがjsonのパスを保持する必要がある。

ドラッグアンドドロップ時、

from toのパスを探索し、fromオブジェクトの取得、toオブジェクトへの追加
を実施。

名前が重複する場合は、適当にキーに値を追加する。


### 参考

<https://code.visualstudio.com/api/references/vscode-api#TreeDragAndDropController%3CT%3E>
drag and dropは対応。これを使用して実装する。

<https://www.npmjs.com/package/jsonpath>
jsonの探索はこれかな～？
これだー。登録もある。


### 課題

読み込みと書き込み時、コメントやtrailing commaを保持したまま再保存することが難しいかもしれない。
しかし、そこはD&Dが使えれば逆にオミットしてしまっても問題ないか。
