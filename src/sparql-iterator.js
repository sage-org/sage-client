/*! @license MIT ©2014-2016 Ruben Verborgh, Ghent University - imec */
/* A SparqlIterator returns the results of a SPARQL query. */

const SparqlParser = require('sparqljs').Parser
const AsyncIterator = require('asynciterator')
const TransformIterator = AsyncIterator.TransformIterator
const BGPOperator = require('./operators/bgp-operator.js')
const GroupByOperator = require('./operators/gb-operator.js')
const AggrOperator = require('./operators/agg-operator.js')
const UnionOperator = require('./operators/union-operator.js')
const SortIterator = require('ldf-client/lib/sparql/SortIterator')
const DistinctIterator = require('ldf-client/lib/sparql/DistinctIterator')
const SparqlExpressionEvaluator = require('./utils/SparqlExpressionEvaluator.js')
const SageRequestClient = require('./utils/sage-request-client');
const _ = require('lodash')
const rdf = require('ldf-client/lib/util/RdfUtil')
const createErrorType = require('ldf-client/lib/util/CustomError')

var queryConstructors = {
  SELECT: SparqlSelectIterator,
  CONSTRUCT: SparqlConstructIterator,
  DESCRIBE: SparqlDescribeIterator,
  ASK: SparqlAskIterator
}

// Creates an iterator from a SPARQL query
function SparqlIterator (source, query, options,url) {
  // Set argument defaults
  if (typeof source.read !== 'function') {
    url = options
    options = query
    query = source
    source = null
  }
  options = options || {}
  source = source || AsyncIterator.single({})

  if (options.servers != null) {
    if (options.servers[url] != null) {
      options.client = options.servers[url];
    }
    else {
      options.servers[url] = new SageRequestClient(url,options.spy);
      options.client = options.servers[url];
    }
  }
  else {
    options.servers = {};
    options.servers[url] = new SageRequestClient(url,options.spy);
    options.client = options.servers[url];
  }


  // Transform the query into a cascade of iterators
  try {
    // Parse the query if needed
    if (typeof query === 'string') { query = new SparqlParser(options.prefixes).parse(query) }
    options.prefixes = query.prefixes;
    console.log(query);
    // Create an iterator that projects the bindings according to the query type
    let queryIterator
    let QueryConstructor = queryConstructors[query.queryType]
    if (!QueryConstructor) { throw new Error('No iterator available for query type: ' + query.queryType) }
    queryIterator = new QueryConstructor(null, query, options)
    // Create an iterator for bindings of the query's graph pattern
    var graphIterator = new SparqlGroupsIterator(source,
      queryIterator.patterns || query.where, options)

    // Create iterators for each order
    for (var i = query.order && (query.order.length - 1); i >= 0; i--) {
      let order = new SparqlExpressionEvaluator(query.order[i].expression)
      let ascending = !query.order[i].descending
      graphIterator = new SortIterator(graphIterator, function (a, b) {
        let orderA = ''
        let orderB = ''
        try { orderA = order(a) } catch (error) { /* ignore order error */ }
        try { orderB = order(b) } catch (error) { /* ignore order error */ }
        if (orderA < orderB) return ascending ? -1 : 1
        if (orderA > orderB) return ascending ? 1 : -1
        return 0
      }, options)
    }

    if (query.group) {
      for (var i = 0; i < query.group.length; i++) {
        var gb = query.group[i];
        graphIterator = new GroupByOperator(graphIterator,gb ,options);
      }
    }

    for (var i = 0; i < query.variables.length; i++) {
      var variable = query.variables[i];
      if (variable.expression != null && typeof variable.expression != "string") {
        if (query.group) {
          graphIterator = new AggrOperator(graphIterator,variable);
        }
        else {
          graphIterator = new GroupByOperator(graphIterator,"*" ,options);
          graphIterator = new AggrOperator(graphIterator,variable);
        }
      }
    }

    queryIterator.source = graphIterator


    // Create iterators for modifiers
    if (query.distinct) { queryIterator = new DistinctIterator(queryIterator, options) }
    // Add offsets and limits if requested
    if ('offset' in query || 'limit' in query) { queryIterator = queryIterator.transform({ offset: query.offset, limit: query.limit }) }
    queryIterator.queryType = query.queryType
    return queryIterator
  } catch (error) {
    if (/Parse error/.test(error.message)) {
      throw new InvalidQueryError(query, error)
    } else {
      throw new UnsupportedQueryError(query, error)
    }
  }
}
TransformIterator.subclass(SparqlIterator)

// Creates an iterator for a parsed SPARQL SELECT query
function SparqlSelectIterator (source, query, options) {
  TransformIterator.call(this, source, options)
  this.setProperty('variables', query.variables)
}
SparqlIterator.subclass(SparqlSelectIterator)

// Executes the SELECT projection
SparqlSelectIterator.prototype._transform = function (bindings, done) {
  this._push(this.getProperty('variables').reduce(function (row, variable) {
    // Project a simple variable by copying its value
    if (variable !== '*') {
      if (variable.expression != null) {
        if (typeof variable.expression === "string") {
          row[variable.variable] = valueOf(variable.expression);
        }
        else {
          row[variable.variable] = valueOf(variable.variable);
        }
      }
      else {
        row[variable] = valueOf(variable)
      }
    } else {
      // Project a star selector by copying all variable bindings
      for (variable in bindings) {
        if (rdf.isVariable(variable)) { row[variable] = valueOf(variable) }
      }
    }
    return row
  }, Object.create(null)))
  done()
  function valueOf (variable) {
    var value = bindings[variable]
    return typeof value === 'string' ? rdf.deskolemize(value) : null
  }
}

// Creates an iterator for a parsed SPARQL CONSTRUCT query
function SparqlConstructIterator (source, query, options) {
  TransformIterator.call(this, source, options)

  // Push constant triple patterns only once
  this._template = query.template.filter(function (triplePattern) {
    return rdf.hasVariables(triplePattern) || this._push(triplePattern)
  }, this)
  this._blankNodeId = 0
}
SparqlIterator.subclass(SparqlConstructIterator)

// Executes the CONSTRUCT projection
SparqlConstructIterator.prototype._transform = function (bindings, done) {
  var blanks = Object.create(null)
  this._template.forEach(function (triplePattern) {
    // Apply the result bindings to the triple pattern, ensuring no variables are left
    let s = triplePattern.subject
    let p = triplePattern.predicate
    let o = triplePattern.object
    let s0 = s[0]
    let p0 = p[0]
    let o0 = o[0]
    if (s0 === '?') { if ((s = rdf.deskolemize(bindings[s])) === undefined) return } else if (s0 === '_') s = blanks[s] || (blanks[s] = '_:b' + this._blankNodeId++)
    if (p0 === '?') { if ((p = rdf.deskolemize(bindings[p])) === undefined) return } else if (p0 === '_') p = blanks[p] || (blanks[p] = '_:b' + this._blankNodeId++)
    if (o0 === '?') { if ((o = rdf.deskolemize(bindings[o])) === undefined) return } else if (o0 === '_') o = blanks[o] || (blanks[o] = '_:b' + this._blankNodeId++)
    this._push({ subject: s, predicate: p, object: o })
  }, this)
  done()
}

// Creates an iterator for a parsed SPARQL DESCRIBE query
function SparqlDescribeIterator (source, query, options) {
  // Create a template with `?var ?p ?o` patterns for each variable
  let variables = query.variables
  let template = query.template = []
  for (var i = 0, l = variables.length; i < l; i++) { template.push(rdf.triple(variables[i], '?__predicate' + i, '?__object' + i)) }
  query.where = query.where.concat({ type: 'bgp', triples: template })
  SparqlConstructIterator.call(this, source, query, options)
}
SparqlConstructIterator.subclass(SparqlDescribeIterator)

// Creates an iterator for a parsed SPARQL ASK query
function SparqlAskIterator (source, query, options) {
  TransformIterator.call(this, source, options)
  this._result = false
}
SparqlIterator.subclass(SparqlAskIterator)

// If an answer to the query exists, output true and end the iterator
SparqlAskIterator.prototype._transform = function (bindings, done) {
  this._result = true
  this.close()
  done()
}

// If no answer was received, output false
SparqlAskIterator.prototype._flush = function (done) {
  this._push(this._result)
  done()
}

// Creates an iterator for a list of SPARQL groups
function SparqlGroupsIterator (source, groups, options) {
  // Chain iterators for each of the graphs in the group
  return groups.reduce(function (source, group) {
    return new SparqlGroupIterator(source, group, options)
  }, source)
}
AsyncIterator.subclass(SparqlGroupsIterator)

// Creates an iterator for a SPARQL group
function SparqlGroupIterator (source, group, options) {
  // Reset flags on the options for child iterators
  var childOptions = options.optional ? _.create(options, { optional: false }) : options

  switch (group.type) {
    case 'bgp':
      var copyGroup = JSON.parse(JSON.stringify(group))
      var ret = transformPath(copyGroup.triples,copyGroup);
      var bgp = ret[0];
      var union = null;
      while (ret[1] != null) {
        union = ret[1]
        var ret = transformPath(bgp,copyGroup);
        bgp = ret[0]
      }
      if (union != null) {
        var bgp1 = bgp.slice(0,union.index)
        var bgp2 = bgp.slice(union.index)
        var pre = {type : "bgp", triples : bgp1}
        var post = {type : "bgp", triples : bgp2}
        return new SparqlGroupsIterator(source, [pre,union.union,post], childOptions)
      }
      else {
        return new BGPOperator(source, bgp, options);
      }
    case 'query':
      return new SparqlIterator(source, group, options, options.client._url);
    case 'service':
      var subquery = group.patterns[0];

      if (subquery.type === "bgp") {
        var tmpQuery = {prefixes : options.prefixes, queryType : "SELECT", variables : ["*"], type: "query", where : [subquery]}
        var newQuery = tmpQuery;
      }
      else {
        var newQuery = subquery;
      }
      return new SparqlIterator(source, newQuery,options, group.name)
    case 'group':
      return new SparqlGroupsIterator(source, group.patterns, childOptions)
    case 'optional':
      childOptions = _.create(options, { optional: true })
      return new SparqlGroupsIterator(source, group.patterns, childOptions)
    case 'union':
      return new UnionOperator(...group.patterns.map(function (patternToken) {
        return new SparqlGroupIterator(source.clone(), patternToken, childOptions)
      }))
    case 'values':
      var vals = group.values;
      var filter = "SELECT * WHERE { FILTER "
      for (var i = 0; i < vals.length; i++) {
        var or = vals[i]
        if (i == 0) {
          filter += " ( ";
        }
        var cpt = 0;
        for (var and in or) {
          if (cpt == 0) {
            filter += " ( ";
          }
          filter += and + ' = ' + or[and];
          if (cpt == Object.keys(or).length - 1) {
            filter += ' ) '
          }
          else {
            filter += ' && '
          }
          cpt += 1
        }

        if (i == vals.length - 1) {
          filter += ' ) '
        }
        else {
          filter += ' || '
        }
      }
      filter += " }"
      var tmpQuery = new SparqlParser().parse(filter);
      var evaluate = new SparqlExpressionEvaluator(tmpQuery.where[0].expression)
      return source.filter(function (bindings) {
        try {
          if (evaluate(bindings) != null) {
            return !/^"false"|^"0"/.test(evaluate(bindings))
          }
          else {
            return false;
          }
        } catch (error) { return false }
      })
    case 'filter':
    // A set of bindings does not match the filter
    // if it evaluates to 0/false, or errors
      var evaluate = new SparqlExpressionEvaluator(group.expression)
      return source.filter(function (bindings) {
        try { return !/^"false"|^"0"/.test(evaluate(bindings)) } catch (error) { return false }
      })
    default:
      throw new Error('Unsupported group type: ' + group.type)
  }
}
AsyncIterator.subclass(SparqlGroupIterator)

transformPath = function(bgp, group){
  var i = 0;
  var queryChange = false;
  var ret = [bgp,null];
  while (i < bgp.length && !queryChange) {
    var curr = bgp[i];
    if (typeof curr.predicate != "string" && curr.predicate.type == "path") {
      switch (curr.predicate.pathType) {
        case "/":
          ret = pathSeq(bgp,curr,i,group)
          if (ret[1] != null) {
            queryChange = true;
          }
          break;
        case "^":
          ret = pathInv(bgp,curr,i,group)
          if (ret[1] != null) {
            queryChange = true;
          }
          break;
        case "|":
          ret = pathAlt(bgp,curr,i,group)
          queryChange = true;
          break;
        default:
          break;
      }
    }
    i++
  }
  return ret;
}

pathSeq = function(bgp,pathTP,ind,group){
  var s = pathTP.subject, p = pathTP.predicate,o = pathTP.object;
  var union = null;
  var newTPs = []
  var blank = "?" + Math.random().toString(36).substring(8);
  for (var j = 0; j < p.items.length; j++) {
    var newTP = {}
    if (j == 0) {
      newTP.subject = s;
      newTP.predicate = p.items[j];
      newTP.object = blank;
    }
    else {
      var prev = blank
      blank = "?" + Math.random().toString(36).substring(8);
      newTP.subject = prev;
      newTP.predicate = p.items[j];
      newTP.object = blank;
      if (j == p.items.length - 1) {
        newTP.object = o;
      }
    }
    var recurs = transformPath([newTP],group)
    if (recurs[1] != null) {
      union = recurs[1]
    }
    var recursedBGP = recurs[0]
    recursedBGP.map(tp => newTPs.push(tp))
  }
  bgp[ind] = newTPs[0]
  for (var k = 1; k < newTPs.length; k++) {
    bgp.splice(ind + k, 0, newTPs[k]);
  }
  return [bgp,union];
}

pathInv = function(bgp,pathTP,ind,group){
  var union = null;
  var s = pathTP.subject, p = pathTP.predicate.items[0],o = pathTP.object;
  var newTP = {subject : o, predicate : p, object : s};
  var recurs = transformPath([newTP],group)
  if (recurs[1] != null) {
    union = recurs[1]
  }
  var recursedBGP = recurs[0]
  bgp[ind] = recursedBGP[0]
  if (recursedBGP.length > 1) {
    for (var i = 1; i < recursedBGP.length; i++) {
      bgp.push(recursedBGP[i]);
    }
  }
  return [bgp,union];
}

pathAlt = function(bgp,pathTP,ind,group){

  var pathIndex = 0
  for (var i = 0; i < group.triples.length; i++) {
    if(containsPath(group.triples[i].predicate,pathTP)){
      pathIndex = i;
    }
  }
  var s = pathTP.subject, p = pathTP.predicate.items, o = pathTP.object;
  var union = {type:"union"}
  union.patterns = [];
  for (var i = 0; i < p.length; i++) {
    var newBGP = {type : "bgp"}
    newBGP.triples = []
    var newTP = {subject : s, predicate : p[i], object : o}
    var recurs = transformPath([newTP],group)[0];
    for (var j = 0; j < recurs.length; j++) {
      newBGP.triples.push(recurs[j])
    }
    union.patterns.push(newBGP);
  }
  bgp.splice(ind,1);
  return [bgp,{union:union,index:pathIndex}];
}

containsPath = function(branch,path){
  if (typeof branch == "string") {
    return false;
  }
  else if (branch === path.predicate) {
    return true;
  }
  else {
    var result = false;
    for (var i = 0; i < branch.items.length; i++) {
      if(containsPath(branch.items[i],path)){
        result = true;
      }
    }
    return result;
  }
}

// Error thrown when the query has a syntax error
var InvalidQueryError = createErrorType('InvalidQueryError', function (query, cause) {
  this.message = 'Syntax error in query\n' + cause.message
})

// Error thrown when no combination of iterators can solve the query
var UnsupportedQueryError = createErrorType('UnsupportedQueryError', function (query, cause) {
  this.message = 'The query is not yet supported\n' + cause.message
})

module.exports = SparqlIterator
SparqlIterator.InvalidQueryError = InvalidQueryError
SparqlIterator.UnsupportedQueryError = UnsupportedQueryError
