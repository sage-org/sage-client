/* file : select-operator.js
MIT License

Copyright (c) 2017 Thomas Minier

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
const rdf = require('ldf-client/lib/util/RdfUtil')

/**
 * SelectOperator applies a SELECT operation (i.e. a projection) on the output of another operator
 * @extends TransformIterator
 * @author Thomas Minier
 */
class SelectOperator extends TransformIterator {
  /**
   * Constructor
   * @param {AsyncIterator} source - The source operator
   * @param {string[]} variables - The variables of the projection
   * @param {Object} options - Options passed to iterator
   */
  constructor (source, query, options = {}) {
    super(source)
    this._options = options
    this._variables = query.variables
    source.on('error', err => this.emit('error', err))
  }

  /**
   * Transform mappings from the source operator using the projection
   * @param {Object} item - The set of mappings on which we apply the projection
   * @param {function} done - To be called when projection is done
   * @return {void}
   */
  _transform (bindings, done) {
    this._push(this._variables.reduce((row, variable) => {
      // Project a simple variable by copying its value
      if (variable !== '*') {
        if (variable.expression != null) {
          if (typeof variable.expression === 'string') {
            row[variable.variable] = valueOf(variable.expression)
          } else {
            row[variable.variable] = valueOf(variable.variable)
          }
        } else {
          row[variable] = valueOf(variable)
        }
      } else {
        // Project a star selector by copying all variable bindings
        for (variable in bindings) {
          if (this._options.artificials != null) {
            if (rdf.isVariable(variable) && !this._options.artificials.includes(variable)) { row[variable] = valueOf(variable) }
          } else {
            if (rdf.isVariable(variable)) { row[variable] = valueOf(variable) }
          }
        }
      }
      return row
    }, Object.create(null)))
    done()
    function valueOf (variable) {
      var value = bindings[variable]
      return typeof value === 'string' ? rdf.deskolemize(value) : null
    }
  }
}

module.exports = SelectOperator
