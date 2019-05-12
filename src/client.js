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

const { HashMapDataset, PlanBuilder } = require('sparql-engine')
const { finalize } = require('rxjs/operators')
const SageGraph = require('./sage-graph.js')
const SageBGPExecutor = require('./executors/sage-bgp-executor.js')
const SageServiceExecutor = require('./executors/sage-service-executor.js')

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
 *  PREFIX dbp: <http://dbpedia.org/property/> .
 *  PREFIX dbo: <http://dbpedia.org/ontology/> .
 *  SELECT * WHERE {
 *    ?s dbp:birthPlace ?place .
 *    ?s a dbo:Architect .
 *  }`
 * const iterator = client.execute(query)
 *
 * iterator.on('data', console.log)
 *
 * iterator.on('error', console.error)
 *
 * iterator.on('end', () => {
 *  console.log('Query execution finished')
 * })
 */
class SageClient {
  /**
   * Constructor
   * @param {string} url - The url of the dataset to query
   */
  constructor (url, spy = null) {
    this._url = url
    this._spy = spy
    this._graph = new SageGraph(url, this._spy)
    this._dataset = new HashMapDataset(url, this._graph)
    this._builder = new PlanBuilder(this._dataset)
    // register the BGP & SERVICE executors for Sage execution context
    this._builder.bgpExecutor = new SageBGPExecutor(this._dataset)
    this._builder.serviceExecutor = new SageServiceExecutor(this._dataset, this._spy)
  }

  /**
   * Build an iterator used to evaluate a SPARQL query against a SaGe server
   * @param  {string} query - SPARQL query to evaluate
   * @return {SparqlIterator} An iterator used to evaluates the query
   */
  execute (query) {
    this._graph.open()
    return this._builder.build(query).pipe(finalize(() => this._graph.close()))
  }
}

module.exports = SageClient
