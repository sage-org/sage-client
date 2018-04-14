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
 * A Formatter that format solution bindings into SPARQL Query Results XML Format
 * @see https://www.w3.org/TR/rdf-sparql-XMLres/
 * @extends Formatter
 * @author Thomas Minier
 */
class XMLFormatter extends Formatter {
  /**
   * Constructor
   * @param {AsyncIterator} source - Source iterator
   * @param {string[]} variables - Projection variables of the SPARQL query
   */
  constructor (source, variables) {
    super(source)
    this._variables = variables
  }
  /**
   * Implements this function to prepend data to the formatter before the first
   * set of solution bindings is processed.
   * @abstract
   * @return {*} Data to prepend
   */
  _prepend () {
    let header = '<?xml version="1.0"?>\n<sparql xmlns="http://www.w3.org/2005/sparql-results#">\n\t<head>\n'
    header += this._variables.map(v => `\t\t<variable name="${v}"/>`).join('\n')
    header += '\n\t</head>\n\t<results>\n'
    return header
  }

  /**
   * Format bindings
   * @abstract
   * @param  {Object} bindings - Bag of solution bindings to format
   * @return {void}
   */
  _format (bindings) {
    let result = '\t\t<result>\n'
    result += compact(map(bindings, (b, v) => {
      const binding = parseBinding(v, b)
      switch (binding.type) {
        case 'iri':
          return `\t\t\t<binding name="${binding.variable}">\n\t\t\t\t<uri>${binding.value}</uri>\n\t\t\t</binding>\n`
        case 'literal':
          return `\t\t\t<binding name="${binding.variable}">\n\t\t\t\t<literal>${binding.value}</literal>\n\t\t\t</binding>\n`
        case 'literal+type':
          return `\t\t\t<binding name="${binding.variable}">\n\t\t\t\t<literal datatype="${binding.datatype}">${binding.value}</literal>\n\t\t\t</binding>\n`
        case 'literal+lang':
          return `\t\t\t<binding name="${binding.variable}">\n\t\t\t\t<literal xml:lang="${binding.lang}">${binding.value}</literal>\n\t\t\t</binding>\n`
        default:
          return null
      }
    })).join('')
    result += '\t\t</result>\n'
    return result
  }

  _append () {
    return '\t</results>\n</sparql>\n'
  }
}

module.exports = XMLFormatter
