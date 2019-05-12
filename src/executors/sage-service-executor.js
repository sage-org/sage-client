/* file : sage-service-executor.js
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

const { ServiceExecutor } = require('sparql-engine')
const SageGraph = require('../sage-graph.js')
const { cloneDeep } = require('lodash')

/**
 * A SageServiceExecutor evaluates SERVICE clauses against a remote sage server
 * @extends GraphExecutor
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
class SageServiceExecutor extends ServiceExecutor {
  constructor (dataset, spy = null) {
    super()
    this._dataset = dataset
    this._spy = spy
  }

  _execute (source, iri, subquery, context) {
    // Dynamically add the remote Graph as a Named Graph to the dataset
    if (!this._dataset.hasNamedGraph(iri)) {
      if (!iri.startsWith('http')) {
        throw new Error(`Invalid URL in SERVICE clause: ${iri}`)
      }
      this._dataset.addNamedGraph(iri, new SageGraph(iri, this._spy))
    }
    const opts = context.clone()
    opts.defaultGraphs = [ iri ]
    return this.builder._buildQueryPlan(subquery, opts, source)
  }
}

module.exports = SageServiceExecutor
