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
var moment = require('moment');
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
  constructor (source, variable,options) {
    super(source)
    this._variable = variable.variable
    this._expression = variable.expression
    this._options = options;
    var that = this;
    this._currentItem = null;
    if (this._options.bnode_count == null) {
      this._options.bnode_count = 0;
    }
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
            if (Number(parsedB.value) === 0) {
              return null
            }
            else {
              var res = Number(parsedA.value) / Number(parsedB.value);
              var result = isNaN(res) ? null : (Number.isInteger(res) ? res.toFixed(1) : res);
              if (result != null) {
                result = this['strdt']([result,"http://www.w3.org/2001/XMLSchema#decimal",true]);
              }
              return result;
            }
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
        try {
          var parsedA = utils.parseBinding("null",a).value;
        } catch (e) {
          var parsedA = null;
        }
        try {
          var parsedB = utils.parseBinding("null",b).value;
        } catch (e) {
          var parsedB = null;
        }
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
        if (args[2] != null && args[2]) {
          parsed = {type:'literal',value:a};
        }
        else {
          var parsed = utils.parseBinding("null",a);
        }
        return (parsed.type == "literal") ? '"' + parsed.value + '"' + "@" + JSON.parse(b) : null
      },

      'strdt': function(args) {
        var a = args[0], b = args[1];
        if (args[2] != null && args[2]) {
          parsed = {type:'literal',value:a};
        }
        else {
          var parsed = utils.parseBinding("null",a);
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

      'hours': function(args) {
        try {
          var date = moment.parseZone(utils.parseBinding("null",args[0]).value);
          return this['strdt']([date.hours(),"http://www.w3.org/2001/XMLSchema#integer",true]);
        } catch (e) {
          return null
        }
      },

      'minutes': function(args) {
        try {
          var date = moment.parseZone(utils.parseBinding("null",args[0]).value);
          return this['strdt']([date.minutes(),"http://www.w3.org/2001/XMLSchema#integer",true]);
        } catch (e) {
          return null
        }
      },

      'seconds': function(args) {
        try {
          var date = moment.parseZone(utils.parseBinding("null",args[0]).value);
          return this['strdt']([date.seconds(),"http://www.w3.org/2001/XMLSchema#decimal",true]);
        } catch (e) {
          return null
        }
      },

      'year': function(args) {
        try {
          var date = moment.parseZone(utils.parseBinding("null",args[0]).value);
          return this['strdt']([date.year(),"http://www.w3.org/2001/XMLSchema#integer",true]);
        } catch (e) {
          return null
        }
      },

      'month': function(args) {
        try {
          var date = moment.parseZone(utils.parseBinding("null",args[0]).value);
          return this['strdt']([date.month()+1,"http://www.w3.org/2001/XMLSchema#integer",true]);
        } catch (e) {
          return null
        }
      },

      'day': function(args) {
        try {
          var date = moment.parseZone(utils.parseBinding("null",args[0]).value);
          return this['strdt']([date.date(),"http://www.w3.org/2001/XMLSchema#integer",true]);
        } catch (e) {
          return null
        }
      },

      'timezone': function(args) {
        try {
          var value = utils.parseBinding("null",args[0]).value;
          if (value.length < 20) {
            return null
          }
          else {
            var date = moment.parseZone(utils.parseBinding("null",args[0]).value);
            var zone = date.utcOffset() / 60
            if (zone > 0) {
              zone = "PT" + zone + "H";
            }
            else if (zone < 0) {
              zone = "-PT" + Math.abs(zone) + "H";
            }
            else {
              zone = "PT0S";
            }
            return this['strdt']([zone,"http://www.w3.org/2001/XMLSchema#dayTimeDuration",true]);
          }
        } catch (e) {
          return null
        }
      },

      'tz': function(args) {
        return utils.parseBinding("null",args[0]).value.slice(19);
      },

      'BNODE': function(args) {
        if (args.length > 0) {
          var value = utils.parseBinding("null",args[0]).value;
        }
        else {
          var value = null;
        }
        if (that._options.artificials == null) {
          that._options.artificials = [];
        }
        if (!that._options.artificials.includes('bnode_map')) {
          that._options.artificials.push('bnode_map');
        }

        if (that._currentItem.bnode_map != null) {
          var bnode = null;
          if (that._currentItem.bnode_map[value] != null && value != null) {
            bnode = that._currentItem.bnode_map[value];
          }
          else {
            bnode = "b"+that._options.bnode_count;
            that._currentItem.bnode_map[value] = bnode;
            that._options.bnode_count ++;
          }
        }
        else {
          that._currentItem.bnode_map = {};
          var bnode = "b"+that._options.bnode_count;
          that._currentItem.bnode_map[value] = bnode;
          that._options.bnode_count ++;
        }
        return bnode;
      },

      'in': function (args) {
        var a = utils.parseBinding("null",args[0]),
          b = args[1].map(function(elem){return utils.parseBinding("null",elem)});
        var filteredDT = _.filter(b,{type:a.type,value:a.value,datatype:a.datatype})
        var filteredLang = _.filter(b,{type:a.type,value:a.value,lang:a.lang})
        return filteredDT.length > 0 || filteredLang.length > 0;
      },

      'notin': function (a, b) {
        var a = utils.parseBinding("null",args[0]),
          b = args[1].map(function(elem){return utils.parseBinding("null",elem)});
        var filteredDT = _.filter(b,{type:a.type,value:a.value,datatype:a.datatype})
        var filteredLang = _.filter(b,{type:a.type,value:a.value,lang:a.lang})
        return filteredDT.length === 0 && filteredLang.length === 0;
      },

      'now': function(args) {
        try {
          var date = moment().format();
          return this['strdt']([date,"http://www.w3.org/2001/XMLSchema#dateTime",true]);
        } catch (e) {
          return null
        }
      },

      'rand': function(args) {
        try {
          var rand = Math.random();
          return this['strdt']([rand,"http://www.w3.org/2001/XMLSchema#double",true]);
        } catch (e) {
          return null
        }
      },

      'iri': function(args) {
        try {
          var value = utils.parseBinding("null",args[0]).value;
          var prefix = that._options.base || "";
          return prefix + value;
        } catch (e) {
          return null
        }
      },

      'uri': function(args) {
        try {
          var value = utils.parseBinding("null",args[0]).value;
          var prefix = that._options.base || "";
          return prefix + value;
        } catch (e) {
          return null
        }
      },

      'lang': function(args) {
        try {
          return utils.parseBinding("null",args[0]).lang.toLowerCase();
        } catch (e) {
          return null
        }
      },

      'if': function(args) {
        if (args[0]) {
          return args[1];
        }
        else if(args[0] === null){
          return null
        }
        else {
          return args[2];
        }
      },

      'coalesce': function(args) {
        var vals = _.without(args, undefined,null);
        return (vals.length > 0) ? vals[0] : null;
      },

      'strbefore': function(args) {
        try {
          var a = utils.parseBinding("null",args[0]),
            b = utils.parseBinding("null",args[1]);
          if (b.lang != null && b.lang != a.lang) {
            return null
          }
          else if (a.datatype != null && b.datatype != null && b.datatype != a.datatype) {
            return null;
          }
          else {
            var end = a.value.indexOf(b.value)
            var type = a.type;
            var res = (end >= 0) ? a.value.slice(0,end) : "";
            if (type === "literal+type") {
              return (a.datatype === "http://www.w3.org/2001/XMLSchema#string") ? this['strdt']([res,a.datatype,true]) : res;
            }
            else if (type === "literal+lang"){
              return this['strlang']([res,'"' + a.lang + '"',true])
            }
            else {
              return res;
            }

          }
        } catch (e) {
          return null;
        }
      },

      'strafter': function(args) {
        try {
          var a = utils.parseBinding("null",args[0]),
            b = utils.parseBinding("null",args[1]);
          if (b.lang != null && b.lang != a.lang) {
            return null
          }
          else if (a.datatype != null && b.datatype != null && b.datatype != a.datatype) {
            return null;
          }
          else {
            var start = a.value.indexOf(b.value)
            var type = a.type;
            var res = (start >= 0) ? a.value.slice(start+b.value.length) : "";
            if (type === "literal+type") {
              return (a.datatype === "http://www.w3.org/2001/XMLSchema#string") ? this['strdt']([res,a.datatype,true]) : res;
            }
            else if (type === "literal+lang"){
              return this['strlang']([res,'"' + a.lang + '"',true])
            }
            else {
              return res;
            }

          }
        } catch (e) {
          return null;
        }
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
    this._currentItem = item;
    var value = this.applyOperator(item,this._expression);
    if (value != null) {
      item[this._variable] = value.toString()
    }
    this._push(item);
    done()
  }

  applyOperator(item,expression){
    var expr = _.cloneDeep(expression);
    var args = expr.args;
    for (var i = 0; i < args.length; i++) {
      if (typeof args[i] === "object" && !Array.isArray(args[i])) {
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
