/* file : sage-operator.ts
MIT License

Copyright (c) 2018-2019 Thomas Minier

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

import { BindingBase, Pipeline } from 'sparql-engine'
import { Bindings } from 'sparql-engine/dist/rdf/bindings'
import { StreamPipelineInput, PipelineStage } from 'sparql-engine/dist/engine/pipeline/pipeline-engine'
import { SageRequestClient, SageResponseBody } from '../sage-http-client'
import { Algebra, Generator } from 'sparqljs'

/**
 * Create a SPARQL query (in string format) from a Basic Graph Pattern
 * @param  bgp - Basic Graph Pattern, i.e., a set of triple patterns
 * @return A conjunctive SPARQL query
 */
function formatBGPQuery (triples: Algebra.TripleObject[]): string {
  const generator = new Generator()
  const bgpNode: Algebra.BGPNode = {
    type: 'bgp',
    triples
  }
  const jsonQuery: Algebra.RootNode = {
    type: "query",
    prefixes: {},
    variables: ['*'],
    queryType: "SELECT",
    where: [ bgpNode ]
  }
  return generator.stringify(jsonQuery)
}

/**
 * Async. function used to evaluate a SPARQL BGP query at a sage server,
 * fetch all query results and insert them in steam fashion
 * into a pipeline of iterators.
 * @author Thomas Minier
 * @param  bgp          - BGP to evaluate
 * @param  sageClient   - Client used to query the SaGe server
 * @param  streamInput  - Input of the pipeline of iterators (where results are injected)
 * @return A Promise that resolves when all query results have been fetched & processed
 */
async function queryBGP (bgp: Algebra.TripleObject[], defaultGraph: string, sageClient: SageRequestClient, streamInput: StreamPipelineInput<Bindings>) {
  let query: string = formatBGPQuery(bgp)
  let hasNext = true
  let next: string | null = null
  while (hasNext) {
    try {
      const body: SageResponseBody = await sageClient.query(query, defaultGraph, next)
      body.bindings
        .forEach(b => streamInput.next(BindingBase.fromObject(b)))
      hasNext = body.hasNext
      if (hasNext) {
        next = body.next
      }
    } catch (e) {
      hasNext = false
      streamInput.error(e)
    }
  }
}

/**
 * An operator used to evaluate a SPARQL BGP query
 * @author Thomas Minier
 * @param bgp  - BGP to evaluate
 * @param sageClient - HTTP client used to query a Sage server
 * @return A stage of the pipeline which produces the query results
 */
export function SageBGPOperator (bgp: Algebra.TripleObject[], defaultGraph: string, sageClient: SageRequestClient): PipelineStage<Bindings> {
  return Pipeline.getInstance().fromAsync(input => {
    queryBGP(bgp, defaultGraph, sageClient, input)
      .then(() => input.complete())
      .catch(err => input.error(err))
  })
}
