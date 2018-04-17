/* file : nlj-operator.js
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
 * A BGPOperator is an iterator over the evaluation of a BGP against a NLJ/BGP interface
 * @extends BufferedIterator
 * @author Thomas Minier
 */
class BGPOperator extends BufferedIterator {
  constructor (bgp, optionals, filters, url, request, spy = null) {
    super()
    this._bgp = bgp
    this._optionals = optionals
    this._filters = filters
    this._next = null
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
    this._spy = spy
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
      const qBody = {
        query: {
          type: 'bgp',
          bgp: this._bgp,
          optional: this._optionals,
          filters: this._filters
        },
        next: this._next
      }

      this._httpClient.post({ body: qBody }, (err, res, body) => {
        if (this._spy !== null) this._spy.reportHTTPRequest()
        if (err) {
          this.emit('error', err)
          this.close()
          done()
        } else {
          this._bufferedValues = body.bindings.slice(0)
          // update overheads
          if (this._spy !== null) {
            this._spy.reportHTTPResponseTime(res.timings.end)
            this._spy.reportOverhead(body.stats.import + body.stats.export)
          }
          if (body.next) {
            this._next = body.next
            this._read(count, done)
          } else {
            this.close()
            done()
          }
        }
      })
    }
  }
}

module.exports = BGPOperator
