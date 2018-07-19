/* file : xml-formatter.js
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

const Formatter = require('./formatter.js')
const { parseBinding } = require('./utils.js')
const { compact, map } = require('lodash')

/**
 * A Formatter that format solution bindings into SPARQL Query Results JSON Format
 * @see https://www.w3.org/TR/sparql11-results-json/
 * @extends Formatter
 * @memberof Formatters
 * @author Thomas Minier
 */
class JSONFormatter extends Formatter {
  /**
   * Constructor
   * @memberof Formatters
   * @param {AsyncIterator} source - Source iterator
   * @param {string[]} variables - Projection variables of the SPARQL query
   */
  constructor (source, variables) {
    super(source)
    this._variables = variables
    this._firstValue = true
  }

  _prepend () {
    let header = '{\n "head": {\n  "vars": [ '
    header += this._variables.map(v => `"${v.substr(1)}"`).join(', ')
    header += ' ]\n },\n "results": {\n  "bindings": [\n'
    return header
  }

  _append () {
    return '\n  ]\n }\n}\n'
  }

  /**
   * Format bindings
   * @abstract
   * @param  {Object} bindings - Bag of solution bindings to format
   * @return {void}
   */
  _format (bindings) {
    let result = ',\n   {\n'
    if (this._firstValue) {
      result = '   {\n'
      this._firstValue = false
    }
    result += compact(map(bindings, (b, v) => {
      const binding = parseBinding(v, b)
      switch (binding.type) {
        case 'iri':
          return `    "${binding.variable.substr(1)}": {\n     "type": "uri" , "value": "${binding.value}"\n    }`
        case 'literal':
          return `    "${binding.variable.substr(1)}": {\n     "type": "literal" , "value": "${binding.value}"\n    }`
        case 'literal+type':
          return `    "${binding.variable.substr(1)}": {\n     "type": "literal" , "value": "${binding.value}", "datatype": "${binding.datatype}"\n    }`
        case 'literal+lang':
          return `    "${binding.variable.substr(1)}": {\n     "type": "literal" , "value": "${binding.value}", "xml:lang": "${binding.lang}"\n    }`
        default:
          return null
      }
    })).join(',\n')
    result += '\n   }'
    return result
  }
}

module.exports = JSONFormatter
