/* file : spy.js
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

/**
 * A Spy inspect SPARQL query execution to provide metadata after query evaluation
 * @author Thomas Minier
 */
class Spy {
  constructor () {
    this._nbHttpCalls = 0
    this._nbResults = 0
    this._responseTimes = []
    this._overheads = []
    this._importTimes = []
    this._exportTimes = []
    this._httpErrors = []
  }

  get nbHTTPCalls () {
    return this._nbHttpCalls
  }

  get nbResults () {
    return this._nbResults
  }

  get httpErrors () {
    return this._httpErrors
  }

  get avgOverhead () {
    return this._overheads.reduce((x, y) => x + y, 0) / this._overheads.length
  }

  get avgImportTime () {
    return this._importTimes.reduce((x, y) => x + y, 0) / this._importTimes.length
  }

  get avgExportTime () {
    return this._exportTimes.reduce((x, y) => x + y, 0) / this._exportTimes.length
  }

  get avgResponseTime () {
    return this._responseTimes.reduce((x, y) => x + y, 0) / this._responseTimes.length
  }

  reportHTTPRequest (count = 1) {
    this._nbHttpCalls += count
  }

  reportHTTPError (err) {
    this._httpErrors.push(err)
  }

  reportSolution (count = 1) {
    this._nbResults += 1
  }

  reportHTTPResponseTime (time) {
    this._responseTimes.push(time)
  }

  reportOverhead (overhead) {
    this._overheads.push(overhead)
  }

  reportImportTime (importTime) {
    this._importTimes.push(importTime)
  }

  reportExportTime (exportTime) {
    this._exportTimes.push(exportTime)
  }
}

module.exports = Spy
