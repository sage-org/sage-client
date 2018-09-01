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

describe('SageClient', () => {
  it('should evaluate a simple SPARQL query', done => {
    const query = `
    prefix dbo: <http://dbpedia.org/ontology/>
    prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?movie ?title ?name WHERE {
      ?movie dbo:starring [ rdfs:label 'Brad Pitt'@en ];
      rdfs:label ?title;
      dbo:director [ rdfs:label ?name ].
      FILTER LANGMATCHES(LANG(?title), 'EN')
      FILTER LANGMATCHES(LANG(?name),  'EN')
    }`
    const client = new SageClient('http://sage.univ-nantes.fr/sparql/dbpedia-2016-04')
    const results = []

    const iterator = client.execute(query)
    iterator.on('error', done)
    iterator.on('data', b => {
      results.push(b)
    })
    iterator.on('end', () => {
      expect(results.length).to.equal(43)
      done()
    })
  }).timeout(2000)

  it('should evaluate a SPARQL query with OPTIONAL clauses', done => {
    const query = `
    prefix dbo: <http://dbpedia.org/ontology/>
    prefix dbr: <http://dbpedia.org/resource/>
    prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?performer ?name WHERE {
      ?work dbo:writer dbr:Michael_Jackson;
        dbo:musicalArtist ?performer.
      OPTIONAL {
        ?performer rdfs:label ?name.
        FILTER LANGMATCHES(LANG(?name), 'EN')
      }
    }`
    const client = new SageClient('http://sage.univ-nantes.fr/sparql/dbpedia-2016-04')
    const results = []

    const iterator = client.execute(query)
    iterator.on('error', done)
    iterator.on('data', b => {
      results.push(b)
    })
    iterator.on('end', () => {
      expect(results.length).to.equal(26)
      done()
    })
  }).timeout(2000)
})
