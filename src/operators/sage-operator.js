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

const { BufferedIterator } = require('asynciterator')

/**
 * A SageOperator is an iterator over the evaluation of a BGP against a NLJ/BGP interface
 * @extends BufferedIterator
 * @memberof Operators
 * @author Thomas Minier
 */
class SageOperator extends BufferedIterator {
  /**
   * Constructor
   * @memberof Operators
   * @param {Object[]} bgp  - BGP to evaluate
   * @param {SageRequestClient} sageClient - HTTP client used to query a Sage server
   * @param {Object[]} optionals  - Optional BGPs to evaluate
   * @param {Object[]} filters  - Set of filters to evaluate
   */
  constructor (bgp, sageClient, options) {
    super()
    this._options = options
    for (var i = 0; i < bgp.length; i++) {
      var tp = bgp[i]
      for (var variable in tp) {
        if (tp[variable].startsWith('_:')) {
          var newVar = '?' + tp[variable].slice(2)
          tp[variable] = newVar
          if (this._options.artificials != null) {
            this._options.artificials.push(newVar)
          } else {
            this._options.artificials = []
            this._options.artificials.push(newVar)
          }
        }
      }
    }
    this._bgp = bgp
    this._next = null
    this._bufferedValues = []
    this._sageClient = sageClient
  }

  _flush (done) {
    if (this._bufferedValues.length > 0) {
      this._bufferedValues.forEach(b => this._push(b))
    }
    done()
  }

  _read (count, done) {
    // try to find values previously downloaded
    while (count > 0 && this._bufferedValues.length > 0) {
      this._push(this._bufferedValues.shift())
      count--
    }

    // fetch more values from the server
    if (count <= 0) {
      done()
    } else {
      this._sageClient.query('bgp', this._bgp, this._next)
        .then(body => {
          this._bufferedValues = body.bindings.slice(0)
          if (body.next) {
            this._next = body.next
            this._read(count, done)
          } else {
            this.close()
            done()
          }
        })
        .catch(err => {
          this.emit('error', err)
          this.close()
          done()
        })
    }
  }
}

module.exports = SageOperator
