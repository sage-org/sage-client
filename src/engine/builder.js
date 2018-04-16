/* file : builder.js
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

const optimizeQuery = require('./optimizer.js')
const BGPOperator = require('../operators/bgp-operator.js')
const ProjectionOperator = require('../operators/projection-operator.js')
const OrderByOperator = require('../operators/orderby-operator.js')
const UnionOperator = require('../operators/union-operator.js')
const Spy = require('./spy.js')

function buildPlan (query, url, request) {
  const plan = optimizeQuery(query)
  const spy = new Spy()
  let operator = null
  if (plan.where[0].type !== 'union') {
    operator = buildGroupPlan(plan.where, url, request, spy)
  } else {
    // const sources = buildGroupPlan(plan.where[0].patterns, url, request, spy)
    const sources = plan.where[0].patterns.map(p => buildGroupPlan(p.patterns, url, request, spy))
    operator = new UnionOperator(...sources)
  }
  if (plan.variables) {
    operator = new ProjectionOperator(operator, plan.variables, spy)
  }
  if (plan.order) {
    operator = new OrderByOperator(operator, plan.order.map(v => v.expression), plan.order[0].descending)
  }
  if (plan.offset > 0) {
    operator = operator.skip(plan.offset)
  }
  if (plan.limit >= 0) {
    operator = operator.take(plan.limit)
  }
  return {
    iterator: operator,
    variables: plan.variables,
    spy
  }
}

function buildGroupPlan (groups, url, request, spy = null) {
  let bgp = []
  let optionals = { triples: [] }
  let filters = []
  groups.forEach(group => {
    switch (group.type) {
      case 'bgp':
        bgp = bgp.concat(group.triples)
        break
      case 'optional':
        group.patterns.forEach(p => {
          optionals.triples = optionals.triples.concat(p.triples)
        })
        break
      case 'filter':
        filters.push(group.expression)
        break
      default:
        break
    }
  })
  return new BGPOperator(bgp, optionals.triples, url, request, spy)
}

module.exports = buildPlan
