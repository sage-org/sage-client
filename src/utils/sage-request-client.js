/* file : sage-request-client.js
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

const request = require('request')

class SageRequestClient {
  /**
   * Constructor
   * @param {string} url - URL of the Sage server to use
   * @param {Spy} [spy=null] - SPy used to gather metadata about query execution
   */
  constructor (url, spy = null) {
    this._url = url
    this._spy = spy
    this._httpClient = request
      .forever({timeout: 1000, minSockets: 10})
      .defaults({
        method: 'POST',
        uri: this._url,
        json: true,
        gzip: true,
        time: true
      })
  }

  query (bgp, next = null) {
    const queryBody = {
      query: {
        type: 'bgp',
        bgp
      },
      next
    }
    console.log(queryBody);
    return new Promise((resolve, reject) => {
      this._httpClient.post({ body: queryBody }, (err, res, body) => {
        if (err || res.statusCode !== 200) {
          if (err) {
            reject(err)
          } else {
            reject(new Error(JSON.stringify(res.body)))
          }
        } else {
          if (this._spy !== null) {
            this._spy.reportHTTPResponseTime(res.timings.end)
            this._spy.reportOverhead(body.stats.import + body.stats.export)
          }
          resolve(body)
        }
      })
    })
  }
}

module.exports = SageRequestClient
