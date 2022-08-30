# ProjectManagerDeepJson README

## what

project manager by deep layer tree view.

![.mdImages/README/20220813_194800.png](https://github.com/ichir0roie/vscode-project-manager-deep-json/blob/main/.mdImages/README/20220813_194800.png)


# How To Use

## JSONCでプロジェクト構成

メニューの設定ボタンから編集。
![](https://github.com/ichir0roie/vscode-project-manager-deep-json/blob/main/.mdImages/README/20220819_172500.png)

その前に一度現在のフォルダーを登録しておくとわかりやすい
![](https://github.com/ichir0roie/vscode-project-manager-deep-json/blob/main/.mdImages/README/20220819_172608.png)

```jsonc
{
    "tagA":{
        "tagA":"これは上のフォルダのパスとして動作する",
        "project":"this is path",
    },
    "tagB":{
        "projectB":[
            "can multi path",
            "folder B",
            "or workspace",
        ],
        "sub tag":{
            "path":"--.code-workspace",
        },
    },
}
```

構造例。jsonc形式で自由に記述可能。
バグらない限り制限はない。

## 動作

+ クリック
  + 新しいWindowで開く
+ inlineボタンから開く
  + このwindowで開く
  + （複数フォルダの場合は、新しく開く)
+ 親と同じパス名
  + 親のパスとして扱われる。


# Todo

## Next

+ 追加時の名前設定機能のオミット
  + オプション化
  + 名前自動生成？

## Important

+ クリックしないと表示されない場合がある。

## Maybe later.

+ New Window系
  + 各パターンのオプション化

## Don't have to

+ Explorer右クリックで追加
+ drag and drop
+ ssh
+ docker
+ New Project

## difficult

+ selection clear after selected














