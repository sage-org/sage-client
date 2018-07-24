/* file : bgp-operator.js
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

const { MultiTransformIterator } = require('asynciterator')
const SageOperator = require('./sage-operator.js')
const rdf = require('ldf-client/lib/util/RdfUtil')
const { assign, some, size } = require('lodash')

class BGPOperator extends MultiTransformIterator {
  constructor (source, bgp, options) {
    super(source, options)
    this._bgp = bgp
    this._options = options;
    this._sageClient = options.client
  }

  _createTransformer (bindings) {
    const boundedBGP = this._bgp.map(p => rdf.applyBindings(bindings, p))
    const hasVars = boundedBGP.map(p => some(p, v => v.startsWith('?')))
      .reduce((acc, v) => acc && v, true)
    return new SageOperator(boundedBGP, this._sageClient,this._options)
      .map(item => {
        if (size(item) === 0 && hasVars) return null
        return assign(item, bindings)
      })
  }
}

module.exports = BGPOperator
