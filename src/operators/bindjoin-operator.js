/* file : bindjoin-operator.js
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

const { BufferedIterator } = require('asynciterator')
const _ = require('lodash')
/**
 * BindJoinOperator applies a BindJoin algorithm on the output of another operator.
 * @extends BufferedIterator
 * @memberof Operators
 * @author Corentin Marionneau
 */
class BindJoinOperator extends BufferedIterator {
  /**
   * Constructor
   * @memberof Operators
   * @param {AsyncIterator} source - The source operator
   */
  constructor (source, bgp, graph, options) {
    super(source)
    this._bucket = []
    this._graph = graph
    this._bgp = bgp
    this._options = options
    this._sourceEnd = false
    this._source = source
    this._next = null
    this._map = []
    this._vars = []
    this._running = false
  }

  _read (item, done) {
    var that = this
    var fillBucket = function () {
      var mapping
      while (that._bucket.length < 15 && that._source._readable && (mapping = that._source.read())) {
        if (mapping != null) {
          var cpt = that._bucket.length
          var bind = _.cloneDeep(that._bgp)
          for (let i = 0; i < bind.length; i++) {
            for (var v in mapping) {
              var tp = bind[i]
              if (tp.subject === v) {
                tp.subject = mapping[v]
              } else if (tp.subject.startsWith('?') && mapping[tp.subject] == null && !tp.subject.endsWith('_' + cpt)) {
                tp.subject = tp.subject + '_' + cpt
                if (!that._vars.includes(tp.subject)) {
                  that._vars.push(tp.subject)
                }
              }
              if (tp.predicate === v) {
                tp.predicate = mapping[v]
              } else if (tp.predicate.startsWith('?') && mapping[tp.predicate] == null && !tp.predicate.endsWith('_' + cpt)) {
                tp.predicate = tp.predicate + '_' + cpt
                if (!that._vars.includes(tp.predicate)) {
                  that._vars.push(tp.predicate)
                }
              }
              if (tp.object === v) {
                tp.object = mapping[v]
              } else if (tp.object.startsWith('?') && mapping[tp.object] == null && !tp.object.endsWith('_' + cpt)) {
                tp.object = tp.object + '_' + cpt
                if (!that._vars.includes(tp.object)) {
                  that._vars.push(tp.object)
                }
              }
            }
          }
          that._map[cpt] = mapping
          that._bucket.push(bind)
        }
      }
      return that._read()
    }

    if (that._next != null) {
      that._running = true
      that._graph.evalUnion(that._bucket, that._next)
        .then(body => {
          var bindings = body.bindings.slice(0)
          var numbers = []
          if (bindings.length > 0 && _.isEmpty(bindings[0]) && that._options.optional !== true) {
            for (let i = 0; i < body.stats.cardinalities.length; i++) {
              let card = body.stats.cardinalities[i]
              if (card.cardinality > 0) {
                that._push(that._map[i])
              }
            }
          } else if (bindings.length > 0 && !_.isEmpty(bindings[0])) {
            for (let i = 0; i < bindings.length; i++) {
              var binding = bindings[i]
              var newBinding = {}
              var number = -1
              for (var variable in binding) {
                var split = variable.split('_')
                number = parseInt(split[split.length - 1])
                newBinding[split.slice(0, -1).join('_')] = binding[variable]
              }
              newBinding = Object.assign(newBinding, that._map[number])
              numbers.push(number)
              that._push(newBinding)
            }
          }
          if (that._options.optional != null && that._options.optional === true) {
            for (let i = 0; i < Object.keys(that._map).length; i++) {
              if (!numbers.includes(i)) {
                that._push(that._map[i])
              }
            }
          }
          that._running = false
          if (body.next) {
            that._next = body.next
            return that._read()
          } else {
            that._next = null
            that._bucket = []
            that._map = []
            if (!that._sourceEnd) {
              return fillBucket()
            } else {
              that._reading = false
              return that.close()
            }
          }
        })
    } else {
      if (!that._running && (that._sourceEnd || that._bucket.length > 14)) {
        that._running = true
        that._graph.evalUnion(that._bucket, that._next)
          .then(body => {
            let bindings = body.bindings.slice(0)
            let numbers = []
            if (bindings.length > 0 && _.isEmpty(bindings[0]) && that._options.optional !== true) {
              for (let i = 0; i < body.stats.cardinalities.length; i++) {
                var card = body.stats.cardinalities[i]
                if (card.cardinality > 0) {
                  that._push(that._map[i])
                }
              }
            } else if (bindings.length > 0 && !_.isEmpty(bindings[0])) {
              let numbers = []
              for (let i = 0; i < bindings.length; i++) {
                var binding = bindings[i]
                var newBinding = {}
                var number = -1
                for (var variable in binding) {
                  var split = variable.split('_')
                  number = parseInt(split[split.length - 1])
                  newBinding[split.slice(0, -1).join('_')] = binding[variable]
                }
                newBinding = Object.assign(newBinding, that._map[number])
                numbers.push(number)
                that._push(newBinding)
              }
            }
            if (that._options.optional != null && that._options.optional === true) {
              for (let i = 0; i < Object.keys(that._map).length; i++) {
                if (!numbers.includes(i)) {
                  that._push(that._map[i])
                }
              }
            }
            that._running = false
            if (body.next) {
              that._next = body.next
              return that._read()
            } else {
              that._next = null
              that._bucket = []
              that._map = []
              if (!that._sourceEnd) {
                return fillBucket()
              } else {
                that._reading = false
                return that.close()
              }
            }
          })
          .catch(err => {
            that.emit('error', err)
            that.close()
            done()
          })
      } else if (that._source._events.readable == null) {
        that._source.on('readable', fillBucket)
      } else if (!that._running && that._source._events.end == null) {
        that._source.on('end', function () {
          that._sourceEnd = true
          that._read()
        })
      }
    }
  }
}

module.exports = BindJoinOperator
