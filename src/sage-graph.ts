/* file : sage-graph.ts
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

import { Graph, Pipeline } from 'sparql-engine'
import { Bindings } from 'sparql-engine/dist/rdf/bindings'
import ExecutionContext from 'sparql-engine/dist/engine/context/execution-context'
import { PipelineStage, PipelineInput } from 'sparql-engine/dist/engine/pipeline/pipeline-engine'
import { Algebra } from 'sparqljs'
import { SageRequestClient } from './sage-http-client'
import { SageBGPOperator, SageManyBGPOperator } from './operators/sage-operators'
import Spy from './spy'

/**
 * A SageGraph implements the Graph abstract class,
 * so it can be used to execute SPARQL queries
 * at a SaGe server using the sparl-engine framework.
 * @author Thomas Minier
 */
export default class SageGraph extends Graph {
  private readonly _url: string
  private readonly _defaultGraph: string
  private readonly _httpClient: SageRequestClient
  private readonly _spy: Spy | undefined

  constructor (url: string, defaultGraph: string, spy?: Spy) {
    super()
    this._url = url
    this._defaultGraph = defaultGraph
    this._spy = spy
    this._httpClient = new SageRequestClient(this._url, this._spy)
  }

  find (triple: Algebra.TripleObject, context: ExecutionContext): PipelineInput<Algebra.TripleObject> {
    const input = this.evalBGP([triple], context)
    return Pipeline.getInstance().map(input, bindings => {
      return bindings.bound(triple)
    })
  }

  evalBGP (bgp: Algebra.TripleObject[], context: ExecutionContext): PipelineStage<Bindings> {
    return SageBGPOperator(bgp, this._defaultGraph, this._httpClient)
  }

  evalUnion (patterns: Array<Algebra.TripleObject[]>, options: ExecutionContext): PipelineStage<Bindings> {
    return SageManyBGPOperator(patterns, this._defaultGraph, this._httpClient)
  }

  open () {
    this._httpClient.open()
  }

  close () {
    this._httpClient.close()
  }

  insert (): Promise<void> {
    return Promise.reject(new Error('A Sage Graph is read-only: remote updates are not allowed'))
  }

  delete (): Promise<void> {
    return Promise.reject(new Error('A Sage Graph is read-only: remote updates are not allowed'))
  }

  clear (): Promise<void> {
    return Promise.reject(new Error('A Sage Graph is read-only: remote updates are not allowed'))
  }
}
