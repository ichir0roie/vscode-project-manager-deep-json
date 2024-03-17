# ProjectManagerDeepJson README

![](https://github.com/ichir0roie/vscode-project-manager-deep-json/blob/main/.mdImages/README/20221008_183038.png)

## what

project manager by deep layer tree view.

jsonで記述された自由なツリー構造でパスを管理できる。

# How To Use

## JSONCでプロジェクト構成

メニューの設定ボタンから編集。

+ Drag And Drop を実装！
  + 要素の移動を行える。
  + 順番は調整できない。

```jsonc
{
    "tagA":{
        "project":"this is path",
    },
    "tagB":{
        "projectB":[
            "can multi path",
            "folder B",
            "or workspace",
            "when clicked , open all paths as new window",
        ],
        "this":{
          "is":{
            "project manager":{
              "deep":"json",
            }
          }
        },
    },
    "key":"can write on jsonc.",
}
```


## 動作

+ 末端要素をクリック
  + 新しいWindowで開く
+ フォルダをクリック
  + 展開
+ 右クリック
  + メニュー表示
+ 右のボタン
  + new window or this window










