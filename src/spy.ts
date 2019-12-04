/* file : spy.ts
MIT License

Copyright (c) 2018-2020 Thomas Minier

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
export default class Spy {
  private _nbHttpCalls: number
  private _nbResults: number
  private _responseTimes: Array<number>
  private _overheads: Array<number>
  private _importTimes: Array<number>
  private _exportTimes: Array<number>
  private _httpErrors: Array<Error>

  constructor () {
    this._nbHttpCalls = 0
    this._nbResults = 0
    this._responseTimes = []
    this._overheads = []
    this._importTimes = []
    this._exportTimes = []
    this._httpErrors = []
  }

  get nbHTTPCalls (): number {
    return this._nbHttpCalls
  }

  get nbResults (): number {
    return this._nbResults
  }

  get httpErrors (): Array<Error> {
    return this._httpErrors
  }

  get avgOverhead (): number {
    return this._overheads.reduce((x, y) => x + y, 0) / this._overheads.length
  }

  get avgImportTime (): number {
    return this._importTimes.reduce((x, y) => x + y, 0) / this._importTimes.length
  }

  get avgExportTime (): number {
    return this._exportTimes.reduce((x, y) => x + y, 0) / this._exportTimes.length
  }

  get avgResponseTime (): number {
    return this._responseTimes.reduce((x, y) => x + y, 0) / this._responseTimes.length
  }

  reportHTTPRequest (count = 1): void {
    this._nbHttpCalls += count
  }

  reportHTTPError (err: Error) {
    this._httpErrors.push(err)
  }

  reportSolution (count: number = 1) {
    this._nbResults += count
  }

  reportHTTPResponseTime (time: number): void {
    this._responseTimes.push(time)
  }

  reportOverhead (overhead: number): void {
    this._overheads.push(overhead)
  }

  reportImportTime (importTime: number): void {
    this._importTimes.push(importTime)
  }

  reportExportTime (exportTime: number): void {
    this._exportTimes.push(exportTime)
  }
}
