/* file : plan-builder.js
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

const SparqlParser = require('sparqljs').Parser
const AsyncIterator = require('asynciterator')
const BGPOperator = require('../operators/bgp-operator.js')
const ValuesOperator = require('../operators/values-operator.js')
const BindJoinOperator = require('../operators/bindjoin-operator.js')
const GroupByOperator = require('../operators/gb-operator.js')
const OperationOperator = require('../operators/op-operator.js')
const AggrOperator = require('../operators/agg-operator.js')
const UnionOperator = require('../operators/union-operator.js')
const SortIterator = require('ldf-client/lib/sparql/SortIterator')
const DistinctIterator = require('../operators/distinct-operator.js')
const SparqlExpressionEvaluator = require('../utils/SparqlExpressionEvaluator.js')
const SageRequestClient = require('../utils/sage-request-client')
// solution modifiers
const SelectOperator = require('../operators/modifiers/select-operator.js')
const AskOperator = require('../operators/modifiers/ask-operator.js')
const ConstructOperator = require('../operators/modifiers/construct-operator.js')
const DescribeOperator = require('../operators/modifiers/describe-operator.js')
// utils
const _ = require('lodash')
const { transformPath } = require('./property-paths.js')

const queryConstructors = {
  SELECT: SelectOperator,
  CONSTRUCT: ConstructOperator,
  DESCRIBE: DescribeOperator,
  ASK: AskOperator
}

function replaceValues (bgp, val) {
  var bgpCopy = _.cloneDeep(bgp)
  for (let i = 0; i < bgpCopy.triples.length; i++) {
    var tp = bgpCopy.triples[i]
    for (var variable in val) {
      if (tp.subject === variable) {
        tp.subject = val[variable]
      }
      if (tp.predicate === variable) {
        tp.predicate = val[variable]
      }
      if (tp.object === variable) {
        tp.object = val[variable]
      }
    }
  }
  return bgpCopy
}

/**
 * A PlanBuilder builds a physical query execution plan of a SPARQL query,
 * i.e., an iterator that can be consumed to get query results.
 * @author Thomas Minier
 * @author Corentin Marionneau
 */
class PlanBuilder {
  constructor () {
    this._dispatcher = null
  }

  build (query, url, options = {}, source = null) {
    if (_.isNull(source)) {
      source = AsyncIterator.single({})
    }

    if (options.servers != null) {
      if (options.servers[url] != null) {
        options.client = options.servers[url]
      } else {
        options.servers[url] = new SageRequestClient(url, options.spy)
        options.client = options.servers[url]
      }
    } else {
      options.servers = {}
      options.servers[url] = new SageRequestClient(url, options.spy)
      options.client = options.servers[url]
    }

    try {
      // Parse the query if needed
      if (typeof query === 'string') { query = new SparqlParser(options.prefixes).parse(query) }
      options.prefixes = query.prefixes
      // Create an iterator that projects the bindings according to the query type
      if (query.base != null) {
        options.base = query.base
      }
      // Create an iterator for bindings of the query's graph pattern
      let graphIterator
      if (query.patterns != null || (query.where != null && query.where.length > 0)) {
        graphIterator = this._buildWhere(source,
          query.patterns || query.where, options)
      } else {
        graphIterator = new AsyncIterator.SingletonIterator({})
      }

      if (query.group) {
        for (let i = 0; i < query.group.length; i++) {
          var gb = query.group[i]
          if (gb.expression != null && typeof gb.expression !== 'string' && gb.expression.type === 'operation') {
            graphIterator = new OperationOperator(graphIterator, gb, options, false)
            var tmpGB = {expression: gb.variable}
            graphIterator = new GroupByOperator(graphIterator, tmpGB, options)
          } else {
            graphIterator = new GroupByOperator(graphIterator, gb, options)
          }
        }
      }

      if (query.having != null) {
        for (let i = 0; i < query.having.length; i++) {
          var hav = query.having[i]
          for (var j = 0; j < hav.args.length; j++) {
            if (typeof hav.args[j] !== 'string') {
              var newVar = '?tmp_' + Math.random().toString(36).substring(8)
              if (options.artificials == null) {
                options.artificials = []
              }
              options.artificials.push(newVar)
              var aggrVar = {variable: newVar, expression: hav.args[j]}
              if (query.group) {
                graphIterator = new AggrOperator(graphIterator, aggrVar)
              } else {
                query.group = 'placeholder'
                graphIterator = new GroupByOperator(graphIterator, '*', options)
                graphIterator = new AggrOperator(graphIterator, aggrVar)
              }
              hav.args[j] = newVar
            }
          }
          var filter = {type: 'filter', expression: hav}
          graphIterator = this._buildGroup(graphIterator, filter, options)
        }
      }

      if (query.variables != null) {
        for (let i = 0; i < query.variables.length; i++) {
          var variable = query.variables[i]
          if (variable.expression != null && typeof variable.expression !== 'string') {
            if (variable.expression.type === 'operation') {
              graphIterator = new OperationOperator(graphIterator, variable, options, false)
            } else if (variable.expression.type === 'aggregate') {
              if (query.group) {
                graphIterator = new AggrOperator(graphIterator, variable)
              } else {
                graphIterator = new GroupByOperator(graphIterator, '*', options)
                graphIterator = new AggrOperator(graphIterator, variable)
              }
            } else {
              throw new Error('Unknown variable type : ' + variable.expression.type)
            }
          }
        }
      }

      // Create iterators for each order
      for (let i = query.order && (query.order.length - 1); i >= 0; i--) {
        let order = new SparqlExpressionEvaluator(query.order[i].expression)
        let ascending = !query.order[i].descending
        graphIterator = new SortIterator(graphIterator, (a, b) => {
          let orderA = ''
          let orderB = ''
          try { orderA = order(a) } catch (error) { /* ignore order error */ }
          try { orderB = order(b) } catch (error) { /* ignore order error */ }
          if (!isNaN(orderA)) {
            orderA = Number(orderA)
          }
          if (!isNaN(orderB)) {
            orderB = Number(orderB)
          }
          if (orderA < orderB) return ascending ? -1 : 1
          if (orderA > orderB) return ascending ? 1 : -1
          return 0
        }, options)
      }

      let queryIterator
      let QueryConstructor = queryConstructors[query.queryType]
      if (!QueryConstructor) { throw new Error('No iterator available for query type: ' + query.queryType) }
      queryIterator = new QueryConstructor(graphIterator, query, options)
      if (query.values != null) {
        query.where.push({type: 'values', values: query.values})
      }

      // Create iterators for modifiers
      if (query.distinct) { queryIterator = new DistinctIterator(queryIterator, options) }
      // Add offsets and limits if requested
      if ('offset' in query || 'limit' in query) { queryIterator = queryIterator.transform({ offset: query.offset, limit: query.limit }) }
      queryIterator.queryType = query.queryType
      return queryIterator
    } catch (error) {
      console.error(error)
    }
  }

  _buildWhere (source, groups, options) {
    // Chain iterators for each of the graphs in the group
    // var bgps = _.filter(groups,{'type':'bgp'})
    // var binds = _.filter(groups,{'type':'bind'})
    // if (binds.length > 0 && bgps.length > 1) {
    //
    // }
    // else if (bgps.length > 1) {
    //   var firstBGP = _.findIndex(groups,{'type':'bgp'})
    //   var allBGPs = {type:'bgp',triples:[]};
    //   for (let i = 0; i < bgps.length; i++) {
    //     var bgp = bgps[i]
    //     allBGPs.triples = _.concat(allBGPs.triples,bgp.triples);
    //   }
    //   groups = _.filter(groups,function(o){return o.type != 'bgp';})
    //   groups.splice(firstBGP,0,allBGPs);
    // }
    groups.sort(function (a, b) {
      if (a.type === b.type) {
        return 0
      } else if (a.type === 'filter' || b.type === 'values') {
        return 1
      } else if (b.type === 'filter' || a.type === 'values') {
        return -1
      } else {
        return 0
      }
    })
    var newGroups = []
    var prec = null
    for (let i = 0; i < groups.length; i++) {
      var group = groups[i]
      if (group.type === 'bgp' && prec != null && prec.type === 'bgp') {
        let lastGroup = newGroups[newGroups.length - 1]
        lastGroup.triples = _.concat(lastGroup.triples, group.triples)
      } else {
        newGroups.push(group)
      }
      prec = groups[i]
    }
    groups = newGroups
    if (groups[0].type === 'values') {
      var vals = groups[0].values
      var bgpIndex = _.findIndex(groups, {'type': 'bgp'})
      var union = {type: 'union', patterns: []}
      for (let i = 0; i < vals.length; i++) {
        for (var val in vals[i]) {
          if (vals[i][val] == null) {
            delete vals[i][val]
          }
        }
        var newBGP = replaceValues(groups[bgpIndex], vals[i])
        var unit = _.cloneDeep(groups.slice(1, -1))
        unit[bgpIndex - 1] = newBGP
        union.patterns.push({type: 'group', patterns: unit, value: vals[i]})
      }
      return new UnionOperator(...union.patterns.map(patternToken => {
        var unionIter = this._buildGroup(source.clone(), patternToken, options)
        return new ValuesOperator(unionIter, patternToken.value, options)
      }))
    } else {
      return groups.reduce((source, group) => {
        return this._buildGroup(source, group, options)
      }, source)
    }
  }

  /**
   * Build a physical plan for a SPARQL group
   * @param  {[type]} source  [description]
   * @param  {[type]} group   [description]
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  _buildGroup (source, group, options) {
    // Reset flags on the options for child iterators
    var childOptions = options.optional ? _.create(options, { optional: false }) : options

    switch (group.type) {
      case 'bgp':
        var copyGroup = Object.assign({}, group)
        var ret = transformPath(copyGroup.triples, copyGroup, options)
        var bgp = ret[0]
        var union = ret[1]
        var filter = ret[2]
        if (union != null) {
          return this._buildGroup(source, union, childOptions)
        } else if (filter.length > 0) {
          var groups = [{type: 'bgp', triples: bgp}]
          for (let i = 0; i < filter.length; i++) {
            groups.push(filter[i])
          }
          return this._buildWhere(source, groups, childOptions)
        } else {
          var isSingleton = false
          var typeFound = false
          var tested = source
          while (!typeFound) {
            if (tested instanceof AsyncIterator.ClonedIterator) {
              if (tested._source != null) {
                tested = tested._source
              } else {
                isSingleton = true
                typeFound = true
              }
            } else if (tested instanceof AsyncIterator.SingletonIterator) {
              isSingleton = true
              typeFound = true
            } else {
              typeFound = true
            }
          }
          if (!isSingleton) {
            return new BindJoinOperator(source, bgp, options)
          } else {
            return new BGPOperator(source, bgp, options)
          }
        }
      case 'query':
        return this.build(group, options.client._url, options, source)
      case 'service':
        var subquery = group.patterns[0]
        let newQuery = subquery
        if (subquery.type === 'bgp') {
          var tmpQuery = {prefixes: options.prefixes, queryType: 'SELECT', variables: ['*'], type: 'query', where: [subquery]}
          newQuery = tmpQuery
        }
        return this.build(newQuery, group.name, options, source)
      case 'group':
        return this._buildWhere(source, group.patterns, childOptions)
      case 'optional':
        childOptions = _.create(options, { optional: true })
        return this._buildWhere(source, group.patterns, childOptions)
      case 'union':
        return new UnionOperator(...group.patterns.map(patternToken => {
          return this._buildGroup(source.clone(), patternToken, childOptions)
        }))
      case 'bind':
        return new OperationOperator(source, group, options, true)
      case 'filter':
      // A set of bindings does not match the filter
      // if it evaluates to 0/false, or errors

        var evaluate = new SparqlExpressionEvaluator(group.expression)
        return source.filter(bindings => {
          try { return !/^"false"|^"0"/.test(evaluate(bindings)) } catch (error) { return false }
        })
      default:
        throw new Error('Unsupported group type: ' + group.type)
    }
  }
}

module.exports = PlanBuilder
