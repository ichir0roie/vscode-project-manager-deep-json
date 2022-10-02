# ProjectManagerDeepJson README

## what

project manager by deep layer tree view.

jsonで記述された自由なツリー構造でパスを管理できる。

# How To Use

## JSONCでプロジェクト構成

メニューの設定ボタンから編集。
![](https://github.com/ichir0roie/vscode-project-manager-deep-json/blob/main/.mdImages/README/20220819_172500.png)


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


# Todo

## Next

## Important


## Maybe later.

+ 各パターンのオプション化

## Don't have to

+ Explorer右クリックで追加
+ drag and drop
+ ssh
+ docker
+ New Project

## difficult

+ selection clear after selected














