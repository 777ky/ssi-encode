'use strict';

const fs = require('fs')
const path = require('path')
const jschardet = require('jschardet')
const iconvLite = require('iconv-lite')
const defaults = require('defaults');
const extend = require('extend');
const async = require('async');
const nodeSsi = require("node-ssi");

const syntaxReg = /<!--#([^\r\n]+?)-->/mg;
const includeFileReg = /<!--#\s*include\s+(file|virtual)=(['"])([^\r\n\s]+?)\2\s*(.*?)-->/;
const setVarReg = /<!--#\s*set\s+var=(['"])([^\r\n]+?)\1\s+value=(['"])([^\r\n]*?)\3\s*-->/;
const echoReg = /<!--#\s*echo\s+var=(['"])([^\r\n]+?)\1(\s+default=(['"])([^\r\n]+?)\4)?\s*-->/;
const ifReg = /<!--#\s*if\s+expr=(['"])([^\r\n]+?)\1\s*-->/;
const elifReg = /<!--#\s*elif\s+expr=(['"])([^\r\n]+?)\1\s*-->/;
const elseReg = /<!--#\s*else\s*-->/;
const endifReg = /<!--#\s*endif\s*-->/;

const SSI = function(){};
SSI.prototype = new nodeSsi();

// node-ssi resolveIncludes override
SSI.prototype.resolveIncludes = function(content, options, callback) {
  var matches, seg, isVirtual, basePath, tpath, subOptions, ssi = this;

  async.whilst( // https://www.npmjs.org/package/async#whilst-test-fn-callback-
    function test() {return !!(matches = includeFileReg.exec(content)); },

    function insertInclude(next) {
      seg = matches[0];
      isVirtual = RegExp.$1 == 'virtual';

      // local ADD START
      const ssipath = RegExp.$3;
      basePath = (isVirtual && options.dirname && RegExp.$3.charAt(0) !== '/')? options.dirname : options.baseDir;
      if(options.routes !== {}){
          for(let prop in options.routes) {
              const reg = new RegExp("^"+prop)
              if(reg.test(ssipath)){
                  basePath = options.routes[prop]
              }
          }
      }
      tpath = path.join(basePath, ssipath);
      // local ADD END

      fs.lstat(tpath,
        function(err, stats) {
            if (err) {
                return next(err);
            }
            if (stats.isDirectory()) {
                tpath = tpath.replace(/(\/)?$/, '/index.html');
            }
            fs.readFile(tpath, {
                encoding: options.encoding
            }, function(err, innerContentRaw) {
              if (err) {
                return next(err);
              }
              // ensure that included files can include other files with relative paths
              subOptions = extend({}, options, {dirname: path.dirname(tpath)});

              ssi.resolveIncludes(innerContentRaw, subOptions, function(err, innerContent) {
                if (err) {
                  return next(err);
                }

                // local ADD START
                innerContent　= '<!-- #SSI-START: '+ssipath+' -->' + innerContent+'<!-- #SSI-END: '+ssipath+' -->';
                // local ADD END

                content = content.slice(0, matches.index) + innerContent + content.slice(matches.index + seg.length);
                next(null, content);
              });
            }
          );
        }
      );
    },
    function includesComplete(err) {
      if (err) {
        return callback(err);
      }
      return callback(null, content);
    }
  );
}

module.exports = function watchSSI(option){

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
      // for euc-jp
      content = iconvLite.decode(new Buffer.from(content, "binary"), jschardet.detect(content).encoding );

      res.setHeader("Content-Type", "text/html; charset=UTF-8")
      res.end(content)
    });

  }

}