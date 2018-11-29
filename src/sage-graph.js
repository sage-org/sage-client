/* file : sage-graph.js
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

const { Graph } = require('sparql-engine')
const SageRequestClient = require('./sage-request-client.js')
const SageOperator = require('./operators/sage-operator.js')

class SageGraph extends Graph {
  constructor (url, spy = null) {
    super()
    this._url = url
    this._spy = spy
    this._httpClient = new SageRequestClient(this._url, this._spy)
  }

  insert () {
    throw new Error('A Sage Graph is read-only: INSERT queries are not supported')
  }

  delete () {
    throw new Error('A Sage Graph is read-only: DELETE queries are not supported')
  }

  evalBGP (bgp, options) {
    return SageOperator(bgp, 'bgp', this._httpClient, options)
  }

  evalUnion (patterns, options) {
    return SageOperator(patterns, 'union', this._httpClient, options)
  }

  open () {
    this._httpClient.open()
  }

  close () {
    this._httpClient.close()
  }
}

module.exports = SageGraph
