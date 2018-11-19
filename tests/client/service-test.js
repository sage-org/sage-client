/* file : client-test.js
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

const expect = require('chai').expect
const { SageClient } = require('../../src/lib.js')

describe('Service queries', () => {
  it('should evaluate a simple SERVICE SPARQL query', done => {
    const query = `
    PREFIX dbp: <http://dbpedia.org/property/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT ?titleEng ?title
    WHERE {
      ?movie dbp:starring [ rdfs:label 'Natalie Portman'@en ].
      SERVICE <http://sage.univ-nantes.fr/sparql/dbpedia-2015-04en> {
        ?movie rdfs:label ?titleEng, ?title.
      }
      FILTER LANGMATCHES(LANG(?titleEng), 'en')
      FILTER (LANG(?title) != 'EN')
    }`
    const client = new SageClient('http://sage.univ-nantes.fr/sparql/dbpedia-2016-04')
    const results = []

    const iterator = client.execute(query)
    iterator.subscribe(b => {
      results.push(b)
    }, done, () => {
      expect(results.length).to.equal(239)
      done()
    })
  }).timeout(10000)
})
