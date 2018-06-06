'use strict';

const fs = require('fs')
const path = require('path')
const jschardet = require('jschardet')
const iconvLite = require('iconv-lite')
// const SSI  = require("node-ssi");
const SSI  = require("./fork/node-ssi");
const defaults = require('defaults');

module.exports = function SSIencode(option){
  option = defaults(option,{
    baseDir: ".",
    routes: {},
    encoding: "binary",
    ext: ".html"
  })
  const ssi = new SSI(option)
  return function(req, res, next){
    const url = req.url.slice(-1) === "/" ? req.url + "index" + option.ext : req.url
    const reg = new RegExp("\."+option.ext+"$")

    if (!reg.test(url)) return next()

    const filepath = path.join(option.baseDir, url);

    ssi.compileFile(filepath, option, function(err, content){
      if (err) return next(err)
      content = iconvLite.decode(new Buffer.from(content, "binary"), jschardet.detect(content).encoding );
      res.setHeader("Content-Type", "text/html; charset=UTF-8")
      res.end(content)
    });

  }

}