/* file : sage-bgp-executor.ts
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

import { ExecutionContext, Graph, stages } from 'sparql-engine'
import { Bindings } from 'sparql-engine/dist/rdf/bindings'
import { PipelineStage } from 'sparql-engine/dist/engine/pipeline/pipeline-engine'
import boundJoin from '../operators/bound-join'
import { Algebra } from 'sparqljs'

/**
 * Evaluate Basic Graph patterns using a Sage server.
 * Contrary to the regular BGPStageBuilder,
 * this subclass rely on the Bound Join algorithm to execute joins between BGPs.
 * As the Sage server as a native support for UNION evaluation, it speeds up
 * drastically the query execution by reducing the communication overhead.
 * @extends BGPExecutor
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
export default class SageBGPStageBuilder extends stages.BGPStageBuilder {
  _buildIterator (source: PipelineStage<Bindings>, graph: Graph, patterns: Algebra.TripleObject[], context: ExecutionContext): PipelineStage<Bindings> {
    return boundJoin(source, patterns, graph, context)
  }
}
