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

const GraphExecutor = require('./graph-executor.js')
const SageRequestClient = require('../../utils/sage-request-client')

/**
 * A SageServiceExecutor evaluates SERVICE clauses against a remote sage server
 * @extends GraphExecutor
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
class SageServiceExecutor extends GraphExecutor {
  constructor (defaultClient, builder) {
    super()
    this._builder = builder
    this._clients = new Map()
    this._clients.set('default', defaultClient)
  }

  execute (source, uri, subquery, options) {
    // set Sage client used to evaluate the subquery
    if (!this._clients.has(uri)) {
      if (!uri.startsWith('http')) {
        throw new Error(`Invalid url in SERVICE clause: ${uri}`)
      }
      this._clients.set(uri, new SageRequestClient(uri, options.spy))
    }
    options.client = this._clients.get(uri)
    return this._builder.build(subquery, options, source)
  }
}

module.exports = SageServiceExecutor
