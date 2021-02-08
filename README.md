# ssi-encode

`$ npm i ssi-encode`

nodejsにssiをサポートします。
node-ssiを踏襲して、以下の機能を追加してます。

* euc-jpのincludeファイルをutf-8へ変換
* includeしているファイルの読み込み開始と終了をコメントで表示
```
<!-- #SSI-START:/www/xxx.html -->
 :
 :
<!-- #SSI-END:/www/xxx.html -->
```


## Usage
```
const ssiEncode = require("ssi-encode");

ssiEncode({
  baseDir: __dirname,
  ext: ".html",
  routes:{
    "/_include/": __dirname
  }
})
```

## changelog
* 2020/12/10: includeしているファイルの読み込み開始と終了をコメントで表示
```
<!-- #SSI-START:/www/xxx.html -->
 :
 :
<!-- #SSI-END:/www/xxx.html -->
```
<!-- [![](https://raw.githubusercontent.com/777ky/ssi-encode/image/images/change-20121001.gif)]() -->

