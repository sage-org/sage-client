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
      '+': function (a, b) { return a + b },
      '-': function (a, b) { return a - b },
      '*': function (a, b) { return a * b },
      '/': function (a, b) { return a / b },
      'strlen': function(a) { return a.length}
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
    item[this._variable] = this.applyOperator(item,this._expression).toString()
    this._push(item);
    done()
  }

  applyOperator(item,expression){
    var expr = _.cloneDeep(expression);
    var args = expr.args;
    if (typeof args[0] === "object") {
      args[0] = this.applyOperator(item,args[0])
    }
    else if (typeof args[0] === "string" && args[0].startsWith('?')){
      args[0] = utils.parseBinding(args[0],item[args[0]]).value;
      if (!isNaN(args[0])) {
        args[0] = Number(args[0]);
      }
    }
    else {
      args[0] = utils.parseBinding("null",args[0]).value;
      if (!isNaN(args[0])) {
        args[0] = Number(args[0]);
      }
    }
    if (args[1] != null) {
      if (typeof args[1] === "object") {
        args[1] = this.applyOperator(item,args[1])
      }
      else if (typeof args[1] === "string" && args[1].startsWith('?')){
        args[1] = utils.parseBinding(args[1],item[args[1]]).value;
        if (!isNaN(args[1])) {
          args[1] = Number(args[1]);
        }
      }
      else {
        args[1] = utils.parseBinding("null",args[1]).value;
        if (!isNaN(args[1])) {
          args[1] = Number(args[1]);
        }
      }
    }
    return this._operators[expr.operator](args[0],args[1]);
  }



}

module.exports = OperationOperator
