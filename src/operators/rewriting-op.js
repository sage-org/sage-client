/* file : rewriting-op.js
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

const { map } = require('rxjs/operators')

/**
 * Find a rewriting key in a list of variables
 * For example, in [ ?s, ?o_1 ], the rewriting key is 1
 * @private
 */
function findKey (variables, maxValue = 15) {
  let key = -1
  for (let v of variables) {
    for (var i = 0; i < maxValue; i++) {
      if (v.endsWith('_' + i)) {
        return i
      }
    }
  }
  return key
}

/**
 * Undo the bound join rewriting on solutions bindings, e.g., rewrite all variables "?o_1" to "?o"
 * @private
 */
function revertBinding (key, input, variables) {
  const newBinding = input.empty()
  for (let vName of variables) {
    if (vName.endsWith('_' + key)) {
      const index = vName.indexOf('_' + key)
      newBinding.set(vName.substring(0, index), input.get(vName))
    } else {
      newBinding.set(vName, input.get(vName))
    }
  }
  return newBinding
}

/**
 * Undo the rewriting on solutions bindings, and then merge each of them with the corresponding input binding
 * @private
 */
function rewriteSolutions (bindings, rewritingMap) {
  const key = findKey(bindings.variables())
  // rewrite binding, and then merge it with the corresponding one in the bucket
  let newBinding = revertBinding(key, bindings, bindings.variables())
  if (rewritingMap.has(key)) {
    newBinding = newBinding.union(rewritingMap.get(key))
  }
  return newBinding
}

/**
 * A special operator used to evaluate a UNION query with a Sage server,
 * and then rewrite bindings generated and performs union with original bindings.
 * @author Thomas Minier
 * @private
 * @param  {SageGraph} graph - Graph queried
 * @param  {TripleObject[][]} bgpBucket - List of BGPs to evaluate
 * @param  {Map<String, Binding>} rewritingTable - Map <rewriting key -> original bindings>
 * @param  {Object} options - Query execution option
 * @return {Observable<Binding>} An Observable which evaluates the query.
 */
function rewritingOp (graph, bgpBucket, rewritingTable, options) {
  return graph.evalUnion(bgpBucket, options)
    .pipe(map(bindings => {
      const x = rewriteSolutions(bindings, rewritingTable)
      return x
    }))
}

module.exports = rewritingOp
