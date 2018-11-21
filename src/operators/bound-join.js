/* file : bind-join.js
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

const { Observable } = require('rxjs')
const { bufferCount } = require('rxjs/operators')
const { rdf } = require('sparql-engine/dist/utils.js')
const rewritingOp = require('./rewriting-op.js')

const BIND_JOIN_BUFFER_SIZE = 15

/**
 * Rewrite a triple pattern using a rewriting key, i.e., append "_key" to each SPARQL variable in the triple pattern
 * @private
 * @param key - Rewriting key
 * @param tp - Triple pattern to rewrite
 * @return The rewritten triple pattern
 */
function rewriteTriple (triple, key) {
  const res = Object.assign({}, triple)

  if (rdf.isVariable(triple.subject)) {
    res.subject = triple.subject + '_' + key
  }
  if (rdf.isVariable(triple.predicate)) {
    res.predicate = triple.predicate + '_' + key
  }
  if (rdf.isVariable(triple.object)) {
    res.object = triple.object + '_' + key
  }
  return res
}

/**
 * Performs a Bound Join
 * @author Thomas Minier
 * @param  {Observable<Binding>} source - Source of bindings
 * @param  {TripleObject[]} bgp - Basic Pattern to join with
 * @param  {SageGraph} graph - Graphe queried
 * @param  {Object} options - Query execution options
 * @return {Observable<Binding>} An observable which evaluates the bound join
 */
function boundJoin (source, bgp, graph, options) {
  return new Observable(observer => {
    let sourceClosed = false
    let activeIterators = 0

    // utility function used to close the observable
    function tryClose () {
      activeIterators--
      if (sourceClosed && activeIterators === 0) {
        observer.complete()
      }
    }

    return source
      .pipe(bufferCount(BIND_JOIN_BUFFER_SIZE))
      .subscribe({
        next: bucket => {
          activeIterators++
          // simple case: first join in the pipeline
          if (bucket.length === 1 && bucket[0].isEmpty) {
            graph.evalBGP(bgp).subscribe(b => {
              observer.next(b)
            }, err => observer.error(err), () => tryClose())
          } else {
            // create bound join and execute it
            const bgpBucket = []
            const rewritingTable = new Map()
            let key = 0

            // build the BGP bucket
            bucket.map(binding => {
              const boundedBGP = []
              bgp.forEach(triple => {
                let boundedTriple = binding.bound(triple)
                // rewrite triple and registerthe rewiriting
                boundedTriple = rewriteTriple(boundedTriple, key)
                rewritingTable.set(key, binding)
                boundedBGP.push(boundedTriple)
              })
              bgpBucket.push(boundedBGP)
              key++
            })
            // execute the bucket
            rewritingOp(graph, bgpBucket, rewritingTable, options)
              .subscribe(b => observer.next(b), err => observer.error(err), () => tryClose())
          }
        },
        error: err => observer.error(err),
        complete: () => { sourceClosed = true }
      })
  })
}

module.exports = boundJoin
