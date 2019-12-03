/* file : client.ts
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

import { HashMapDataset, PlanBuilder, Pipeline, stages } from 'sparql-engine'
import SageGraph from './sage-graph'
import Spy from './spy'
import SageBGPStageBuilder from './stages/sage-bgp-stage-builder'

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
 * iterator.subscribe(console.log, console.error, () => {
 *  console.log('Query execution finished')
 * })
 */
export default class SageClient {
  private readonly _url: string
  private readonly _defaultGraph: string
  private readonly _graph: SageGraph
  private readonly _dataset: HashMapDataset
  private readonly _spy: Spy | undefined
  private readonly _builder: PlanBuilder
  /**
   * Constructor
   * @param {string} url - The url of the dataset to query
   */
  constructor (url: string, defaultGraph: string, spy?: Spy) {
    this._url = url
    this._defaultGraph = defaultGraph
    this._spy = spy
    this._graph = new SageGraph(this._url, this._defaultGraph, this._spy)
    this._dataset = new HashMapDataset(url, this._graph)
    // set graph factory to create SageGraph on demand
    this._dataset.setGraphFactory(iri => {
      if (!iri.startsWith('http')) {
        throw new Error(`Invalid URL in SERVICE clause: ${iri}`)
      }
      return new SageGraph(iri, this._defaultGraph, this._spy)
    })
    this._builder = new PlanBuilder(this._dataset)
    // register the BGP stage builder for Sage context
    this._builder.use(stages.SPARQL_OPERATION.BGP, new SageBGPStageBuilder(this._dataset))
  }

  /**
   * Build an iterator used to evaluate a SPARQL query against a SaGe server
   * @param  query - SPARQL query to evaluate
   * @return An iterator used to evaluates the query
   */
  execute (query: string) {
    this._graph.open()
    const pipeline: any = this._builder.build(query)
    return Pipeline.getInstance().finalize(pipeline, () => this._graph.close())
  }
}
