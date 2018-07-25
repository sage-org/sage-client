/* file : op-operator.js
MIT License

Copyright (c) 2018 Thomas Minier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

const { TransformIterator } = require('asynciterator')
const _ = require('lodash')
const map = require('lodash/map')
const utils = require('../formatters/utils')
var N3Util = require('n3').Util
var isLiteral = N3Util.isLiteral,
  literalValue = N3Util.getLiteralValue
var crypto = require('crypto');


/**
 * @extends TransformIterator
 * @memberof Operators
 * @author Corentin Marionneau
 */
class OperationOperator extends TransformIterator {
  /**
   * Constructor
   * @memberof Operators
   * @param {AsyncIterator} source - The source operator
   */
  constructor (source, variable) {
    super(source)
    this._variable = variable.variable
    this._expression = variable.expression
    source.on('error', err => console.error())
    this._operators = {
      '+': function (args) {
        var a = args[0], b = args[1];
        try {
          var parsedA = utils.parseBinding("null",a);
          var parsedB = utils.parseBinding("null",b);
          if (parsedA.datatype != "http://www.w3.org/2001/XMLSchema#string" && parsedB.datatype != "http://www.w3.org/2001/XMLSchema#string") {
            var res = Number(parsedA.value) + Number(parsedB.value);
            return isNaN(res) ? null : res;
          }
          else {
            return null
          }
        } catch (e) {
          return null;
        }
      },
      '-': function (args) {
        var a = args[0], b = args[1];
        try {
          var parsedA = utils.parseBinding("null",a);
          var parsedB = utils.parseBinding("null",b);
          if (parsedA.datatype != "http://www.w3.org/2001/XMLSchema#string" && parsedB.datatype != "http://www.w3.org/2001/XMLSchema#string") {
            var res = Number(parsedA.value) - Number(parsedB.value);
            return isNaN(res) ? null : res;
          }
          else {
            return null
          }
        } catch (e) {
          return null;
        }
      },
      '*': function (args) {
        var a = args[0], b = args[1];
        try {
          var parsedA = utils.parseBinding("null",a);
          var parsedB = utils.parseBinding("null",b);
          if (parsedA.datatype != "http://www.w3.org/2001/XMLSchema#string" && parsedB.datatype != "http://www.w3.org/2001/XMLSchema#string") {
            var res = Number(parsedA.value) * Number(parsedB.value);
            return isNaN(res) ? null : res;
          }
          else {
            return null
          }
        } catch (e) {
          return null;
        }
       },
      '/': function (args) {
        var a = args[0], b = args[1];
        try {
          var parsedA = utils.parseBinding("null",a);
          var parsedB = utils.parseBinding("null",b);
          if (parsedA.datatype != "http://www.w3.org/2001/XMLSchema#string" && parsedB.datatype != "http://www.w3.org/2001/XMLSchema#string") {
            var res = Number(parsedA.value) / Number(parsedB.value);
            return isNaN(res) ? null : res;
          }
          else {
            return null
          }
        } catch (e) {
          return null;
        }
       },
      '=': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        return parsedA == parsedB;
      },
      '!=': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        return parsedA != parsedB;
       },
      '<': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        return parsedA < parsedB;
       },
      '<=': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        return parsedA <= parsedB;
       },
      '>': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        return parsedA > parsedB;
       },
      '>=': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        return parsedA >= parsedB;
       },
      '!': function (args) {
        var a = args[0];
        var parsedA = utils.parseBinding("null",a).value;
        return !parsedA;
      },
      '&&': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        return parsedA && parsedB;
      },
      '||': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        return parsedA || parsedB;
      },
      'str': function (args) {
        var a = args[0];
        var parsed = utils.parseBinding("null",a);
        return '"' + parsed.value + '"';
      },
      'strlen': function(args) {
        var a = args[0];
        var parsedA = utils.parseBinding("null",a).value;
        return parsedA.length;
      },
      'strlang': function(args) {
        var a = args[0], b = args[1];
        var parsed = utils.parseBinding("null",a);
        if (args[2] != null && args[2]) {
          parsed = {type:'literal',value:a};
        }
        return (parsed.type == "literal") ? '"' + parsed.value + '"' + "@" + JSON.parse(b) : null
      },
      'strdt': function(args) {
        var a = args[0], b = args[1];
        var parsed = utils.parseBinding("null",a);
        if (args[2] != null && args[2]) {
          parsed = {type:'literal',value:a};
        }
        return (parsed.type == "literal") ? '"' + parsed.value + '"' + "^^<" + b +">" : null
      },
      'substr': function(args) {
        var a = utils.parseBinding("null",args[0]), b = Number(utils.parseBinding("null",args[1]).value)-1, c = null;
        if (args.length > 2) {
          c = b + Number(utils.parseBinding("null",args[2]).value);
        }
        var res = (c != null) ? a.value.substring(b,c) : a.value.substring(b)
        switch (a.type) {
          case 'literal+type':
            return this['strdt']([res,a.datatype,true]);
            break;
          case 'literal+lang':
            return this['strlang']([res,'"' + a.lang + '"',true]);
            break;
          default:
            return res;
            break;
        }
      },

      'isnumeric': function (args) {
        var a = utils.parseBinding("null",args[0]).value;
        return !isNaN(a);
      },

      'abs': function (args) {
        var a = Number(utils.parseBinding("null",args[0]).value);
        if (isNaN(a)) {
          return null
        }
        else {
          return Math.abs(a);
        }
      },

      'ceil': function (args) {
        var a = Number(utils.parseBinding("null",args[0]).value);
        if (isNaN(a)) {
          return null
        }
        else {
          return Math.ceil(a);
        }
      },

      'floor': function (args) {
        var a = Number(utils.parseBinding("null",args[0]).value);
        if (isNaN(a)) {
          return null
        }
        else {
          return Math.floor(a);
        }
      },

      'round': function (args) {
        var a = Number(utils.parseBinding("null",args[0]).value);
        if (isNaN(a)) {
          return null
        }
        else {
          return Math.round(a);
        }
      },

      'concat': function (args) {
        var parsed = args.map(function(arg){return utils.parseBinding("null",arg)})
        var vals = parsed.map(function(arg){return arg.value})
        var res = _.join(vals,'');
        var sameType = true;
        var type = parsed[0].type,
          sameDT = (type === "literal+type") ? true : false,
          sameLang = (type === "literal+lang") ? true : false,
          dt = (sameDT) ? parsed[0].datatype : null,
          lang = (sameLang) ? parsed[0].lang : null,
          invalidType = (sameDT && dt != "http://www.w3.org/2001/XMLSchema#string") ? true : false;
        for (var i = 1; i < parsed.length; i++) {
          var elem = parsed[i];
          if (type != elem.type) {
            sameType = false;
          }
          if (elem.type === "literal+type" && elem.datatype != "http://www.w3.org/2001/XMLSchema#string") {
            invalidType = true;
          }
          if (dt != elem.datatype) {
            sameDT = false;
          }
          if (lang != elem.lang) {
            sameLang = false;
          }
        }
        if (invalidType) {
          return null;
        }
        else if (sameType && sameDT) {
          return this['strdt']([res,dt,true])
        }
        else if (sameType && sameLang) {
          return this['strlang']([res,'"' + lang + '"',true])
        }
        else {
          return res;
        }
      },

      'ucase': function(args) {
        var a = utils.parseBinding("null",args[0]);
        var res = a.value.toUpperCase();
        switch (a.type) {
          case 'literal+type':
            return this['strdt']([res,a.datatype,true]);
            break;
          case 'literal+lang':
            return this['strlang']([res,'"' + a.lang + '"',true]);
            break;
          default:
            return res;
            break;
        }
      },

      'lcase': function(args) {
        var a = utils.parseBinding("null",args[0]);
        var res = a.value.toLowerCase();
        switch (a.type) {
          case 'literal+type':
            return this['strdt']([res,a.datatype,true]);
            break;
          case 'literal+lang':
            return this['strlang']([res,'"' + a.lang + '"',true]);
            break;
          default:
            return res;
            break;
        }
      },

      'encode_for_uri': function(args) {
        return encodeURI(utils.parseBinding("null",args[0]).value);
      },

      'contains': function (args) {
        var a = utils.parseBinding("null",args[0]).value, b = utils.parseBinding("null",args[1]).value;
        return a.indexOf(b) >= 0
      },

      'strstarts': function (args) {
        var a = String(utils.parseBinding("null",args[0]).value),
          b = String(utils.parseBinding("null",args[1]).value);
        return a.startsWith(b)
      },

      'strends': function (args) {
        var a = String(utils.parseBinding("null",args[0]).value),
          b = String(utils.parseBinding("null",args[1]).value);
        return a.endsWith(b)
      },

      'md5': function(args) {
        var value = utils.parseBinding("null",args[0]).value;
        var md5 = crypto.createHash('md5');
        md5.update(value);
        return md5.digest('hex');
      },

      'sha1': function(args) {
        var value = utils.parseBinding("null",args[0]).value;
        var sha1 = crypto.createHash('sha1');
        sha1.update(value);
        return sha1.digest('hex');
      },

      'sha256': function(args) {
        var value = utils.parseBinding("null",args[0]).value;
        var sha256 = crypto.createHash('sha256');
        sha256.update(value);
        return sha256.digest('hex');
      },

      'sha512': function(args) {
        var value = utils.parseBinding("null",args[0]).value;
        var sha512 = crypto.createHash('sha512');
        sha512.update(value);
        return sha512.digest('hex');
      },
    };
  }

  /**
  /**
   * _read implementation: buffer all values in memory, apply aggregate  function
   * and then, ouput them.
   * @private
   * @return {void}
   */
  _transform (item, done) {
    var value = this.applyOperator(item,this._expression);
    if (value != null) {
      item[this._variable] = this.applyOperator(item,this._expression).toString()
    }
    this._push(item);
    done()
  }

  applyOperator(item,expression){
    var expr = _.cloneDeep(expression);
    var args = expr.args;
    for (var i = 0; i < args.length; i++) {
      if (typeof args[i] === "object") {
        args[i] = this.applyOperator(item,args[i])
      }
      else if (typeof args[i] === "string" && args[i].startsWith('?')){
        if (Array.isArray(item.group) && item[args[i]] == null) {
          args[i] = item.group[0][args[i]]
        }
        else {
          args[i] = item[args[i]]
        }
      }
    }
    var func = this._operators[expr.operator];
    if (func != null) {
      return this._operators[expr.operator](args);
    }
    else {
      throw new Error("Operation not implemented : " + expr.operator)
    }
  }



}

module.exports = OperationOperator
