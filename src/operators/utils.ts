/* file : utils.ts
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

import { Algebra, Generator } from 'sparqljs'

/**
 * Create a SPARQL query (in string format) from a Basic Graph Pattern
 * @param  triples - Set of triple patterns
 * @return A conjunctive SPARQL query
 */
export function formatBGPQuery (generator: Generator, triples: Algebra.TripleObject[]): string {
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
 * Create a SPARQL query (in string format) from a set of Basic Graph Patterns
 * @param  bgps - Set of Basic Graph Patterns, i.e., a set of set of triple patterns
 * @return A SPARQL query
 */
export function formatManyBGPQuery (generator: Generator, bgps: Array<Algebra.TripleObject[]>): string {
  const unionNode: Algebra.GroupNode = {
    type: 'union',
    patterns: bgps.map(triples => {
      return { type: 'bgp', triples }
    })
  }
  const jsonQuery: Algebra.RootNode = {
    type: "query",
    prefixes: {},
    variables: ['*'],
    queryType: "SELECT",
    where: [ unionNode ]
  }
  return generator.stringify(jsonQuery)
}
