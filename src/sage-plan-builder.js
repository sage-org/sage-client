/* file : sage-plan-builder.js
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

const { PlanBuilder } = require('sparql-engine')
const { cloneDeep } = require('lodash')

/**
 * Test if two URLs belongs to the same HUB and extract the graph name
 */
function belongToSameHUB (ref, url) {
  let index = ref.lastIndexOf('/sparql/')
  const refAuthority = ref.substring(0, index + 8)
  index = url.lastIndexOf('/sparql/')
  const urlAuthority = url.substring(0, index + 8)
  return [refAuthority === urlAuthority, url.substring(index + 8)]
}

function annoteTriple (group, graphName) {
  switch (group.type) {
    case 'bgp':
      group.triples = group.triples.map(t => {
        t.graph = graphName
        return t
      })
      return group
    case 'graph': {
      group.patterns = group.patterns.map(p => annoteTriple(p, graphName))
      return group
    }
    case 'group':
    case 'optional':
    case 'union':
      group.patterns = group.patterns.map(p => annoteTriple(p, graphName))
      return group
    default:
      return group
  }
}

class SagePlanBuilder extends PlanBuilder {
  _getGraph (iris) {
    if (iris.length === 0) {
      return this._dataset.getDefaultGraph()
    } else if (iris.length === 1) {
      return this._dataset.getNamedGraph(iris[0])
    }
    return this._dataset.getUnionGraph(iris)
  }

  _buildWhere (source, groups, options) {
    // get URI of the current graph
    const currentGraph = ('_from' in options) ? this._getGraph(options._from.default) : this._dataset.getDefaultGraph()
    const currentIRI = currentGraph.url

    // for Graph queries: use data locality for graphs localted on the same HUB
    let annotatedGroups = []
    groups.forEach(g => {
      if (g.type === 'graph') {
        const [sameAuthority, graphName] = belongToSameHUB(currentIRI, g.name)
        if (sameAuthority) {
          let newGraph = cloneDeep(g)
          newGraph = annoteTriple(newGraph, graphName)
          annotatedGroups = annotatedGroups.concat(newGraph.patterns)
        } else {
          annotatedGroups.push(g)
        }
      } else {
        annotatedGroups.push(g)
      }
    })
    // merge all BGPs in one
    let newGroups = []
    const topLevelBGP = {type: 'bgp', triples: []}
    annotatedGroups.forEach(g => {
      if (g.type === 'bgp') {
        topLevelBGP.triples = topLevelBGP.triples.concat(g.triples)
      } else {
        newGroups.push(g)
      }
    })
    return super._buildWhere(source, [topLevelBGP].concat(newGroups), options)
  }
}

module.exports = SagePlanBuilder
