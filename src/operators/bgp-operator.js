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

const { Readable } = require('stream')

/**
 * A BGPOperator is an iterator over the evaluation of a BGP against a SaGe interface
 * @extends Readable
 * @author Thomas Minier
 */
class BGPOperator extends Readable {
  constructor (bgp, url, request) {
    super({ objectMode: true })
    this._bgp = {}
    this._next = {}
    bgp.forEach((triple, ind) => {
      const key = `tp${ind}`
      this._bgp[key] = triple
    })
    this._url = url
    this._bufferedValues = []
    this._httpClient = request
      .defaults({
        method: 'POST',
        uri: this._url,
        json: true,
        gzip: true,
        time: true
      })
    this._responseTimes = []
    this._overheads = []
  }

  get avgOverhead () {
    return this._overheads.reduce((x, y) => x + y, 0) / this._overheads.length
  }

  get avgResponseTime () {
    return this._responseTimes.reduce((x, y) => x + y, 0) / this._responseTimes.length
  }

  _flush () {
    if (this._bufferedValues.length > 0) {
      this._bufferedValues.forEach(b => this._push(b))
    }
  }

  _read (count) {
    // try to find values previously downloaded
    while (count > 0 && this._bufferedValues.length > 0) {
      this._push(this._bufferedValues.shift())
      count--
    }

    // fetch more values from the server
    if (count > 0) {
      const qBody = {
        bgp: this._bgp,
        next: this._next
      }

      this._httpClient.post({ body: qBody }, (err, res, body) => {
        if (err !== null) {
          this.emit('error', err)
          this._flush()
          this.push(null)
        } else {
          this._bufferedValues = body.bindings.slice(0)
          // update overheads
          this._responseTimes.push(res.timings.end)
          this._overheads.push(body.stats.import + body.stats.export)
          if (body.hasNext) {
            this._next = body.next
            this._read(count)
          } else {
            this._flush()
            this.push(null)
          }
        }
      })
    }
  }
}

module.exports = BGPOperator
