/* file : client.js
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

const buildPlan = require('./engine/builder.js')
const request = require('request')

/**
 * A SageClient is used to evaluate SPARQL queries againt a SaGe server
 * @author Thomas Minier
 * @example
 * 'use strict'
 * const SageClient = require('sage-client')
 *
 * // Create a client to query the DBpedia dataset hosted at http://localhost:8000
 * const url = 'http://localhost:8000/sparql/dbpedia2016'
 * const client = new SageClient(url)
 *
 * const query = `
 *  SELECT * WHERE {
 *    ?s <http://dbpedia.org/property/birthPlace> ?place .
 *    ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://dbpedia.org/ontology/Architect> .
 *  }`
 * const iterator = client.execute(query)
 *
 * iterator.on('data', console.log)
 */
class SageClient {
  /**
   * Constructor
   * @param {string} url - The url of the dataset to query
   */
  constructor (url) {
    this._url = url
    this._httpClient = request.forever({timeout: 1000, minSockets: 10})
  }

  /**
   * Build an iterator used to evaluate a SPARQL query against a SaGe server
   * @param  {string} query - SPARQL query to evaluate
   * @return {AsyncIterator} AN iterator which evaluates the query
   */
  execute (query) {
    return buildPlan(query, this._url, this._httpClient)
  }
}

module.exports = SageClient