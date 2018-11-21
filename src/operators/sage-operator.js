/* file : sage-operator.js
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

const { Observable } = require('rxjs')
const { BindingBase } = require('sparql-engine')

async function query (observer, type, bgp, sageClient, options) {
  let hasNext = true
  let next = null
  while (hasNext) {
    try {
      const body = await sageClient.query(type, bgp, next)
      body.bindings
        .forEach(b => observer.next(BindingBase.fromObject(b)))
      hasNext = body.hasNext
      if (hasNext) {
        next = body.next
      }
    } catch (e) {
      hasNext = false
      observer.error(e)
    }
  }
}

/**
 * Constructor
 * @param {Object[]} bgp  - BGP to evaluate
 * @param {SageRequestClient} sageClient - HTTP client used to query a Sage server
 */
module.exports = function (bgp, type, sageClient, options) {
  return new Observable(observer => {
    query(observer, type, bgp, sageClient, options)
      .then(() => observer.complete())
      .catch(err => observer.error(err))
  })
}
