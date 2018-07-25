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
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        var res = Number(parsedA) + Number(parsedB);
        return isNaN(res) ? null : res;
      },
      '-': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        var res = Number(parsedA) - Number(parsedB);
        return isNaN(res) ? null : res;
      },
      '*': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        var res = Number(parsedA) * Number(parsedB);
        return isNaN(res) ? null : res;
       },
      '/': function (args) {
        var a = args[0], b = args[1];
        var parsedA = utils.parseBinding("null",a).value;
        var parsedB = utils.parseBinding("null",b).value;
        var res = Number(parsedA) / Number(parsedB);
        return isNaN(res) ? null : res;
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
        return (parsed.type == "literal") ? '"' + parsed.value + '"' + "@" + JSON.parse(b) : null
      },
      'strdt': function(args) {
        var a = args[0], b = args[1];
        var parsed = utils.parseBinding("null",a);
        return (parsed.type == "literal") ? '"' + parsed.value + '"' + "^^<" + b +">" : null
      }
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