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
 * @author Thomas Minier
 */
class JSONFormatter extends Formatter {
  /**
   * Constructor
   * @param {AsyncIterator} source - Source iterator
   * @param {string[]} variables - Projection variables of the SPARQL query
   */
  constructor (source, variables) {
    super(source)
    this._variables = variables
    this._firstValue = true
  }

  _prepend () {
    let header = '{\n\t"head": {\n\t\t"vars": [ '
    header += this._variables.map(v => `"${v.substr(1)}"`).join(', ')
    header += ' ]\n\t},\n\t"results": {\n\t\t"bindings": [\n'
    return header
  }

  _append () {
    return '\n\t\t]\n\t}\n}\n'
  }

  /**
   * Format bindings
   * @abstract
   * @param  {Object} bindings - Bag of solution bindings to format
   * @return {void}
   */
  _format (bindings) {
    let result = ',\n\t\t\t{\n'
    if (this._firstValue) {
      result = '\t\t\t{\n'
      this._firstValue = false
    }
    result += compact(map(bindings, (b, v) => {
      const binding = parseBinding(v, b)
      switch (binding.type) {
        case 'iri':
          return `\t\t\t\t"${binding.variable.substr(1)}": {\n\t\t\t\t\t"type": "uri" , "value": "${binding.value}"\n\t\t\t\t}`
        case 'literal':
          return `\t\t\t\t"${binding.variable.substr(1)}": {\n\t\t\t\t\t"type": "literal" , "value": "${binding.value}"\n\t\t\t\t}`
        case 'literal+type':
          return `\t\t\t\t"${binding.variable.substr(1)}": {\n\t\t\t\t\t"type": "literal" , "value": "${binding.value}", "datatype": "${binding.datatype}"\n\t\t\t\t}`
        case 'literal+lang':
          return `\t\t\t\t"${binding.variable.substr(1)}": {\n\t\t\t\t\t"type": "literal" , "value": "${binding.value}", "xml:lang": "${binding.lang}"\n\t\t\t\t}`
        default:
          return null
      }
    })).join(',\n')
    result += '\n\t\t\t}'
    return result
  }
}

module.exports = JSONFormatter
