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
    iterator.subscribe(b => {
      results.push(b)
    }, done, () => {
      expect(results.length).to.equal(43)
      done()
    })
  }).timeout(2000)

  it('should evaluate a SPARQL query with OPTIONAL clauses', done => {
    const query = `
    prefix dbo: <http://dbpedia.org/ontology/>
    prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    prefix dbp: <http://dbpedia.org/property/>

    SELECT ?person ?name ?deathDate WHERE {
      ?person a dbo:Artist;
        rdfs:label ?name;
        dbo:birthPlace [ rdfs:label "York"@en ].
      OPTIONAL { ?person dbp:dateOfDeath ?deathDate. }
    }`
    const client = new SageClient('http://sage.univ-nantes.fr/sparql/dbpedia-2016-04')
    const results = []
    let nbBounded = 0
    const boundedDeathDate = new Map()
    boundedDeathDate.set('http://dbpedia.org/resource/Charles_Francis_Hansom', '"1888"^^<http://www.w3.org/2001/XMLSchema#integer>')
    boundedDeathDate.set('http://dbpedia.org/resource/E_Ridsdale_Tate', '"1922"^^<http://www.w3.org/2001/XMLSchema#integer>')
    boundedDeathDate.set('http://dbpedia.org/resource/Henry_Gyles', '"1709"^^<http://www.w3.org/2001/XMLSchema#integer>')
    boundedDeathDate.set('http://dbpedia.org/resource/Henry_Keyworth_Raine', '"1932"^^<http://www.w3.org/2001/XMLSchema#integer>')
    boundedDeathDate.set('http://dbpedia.org/resource/John_Henry_Middleton', '"1896"^^<http://www.w3.org/2001/XMLSchema#integer>')
    boundedDeathDate.set('http://dbpedia.org/resource/Joseph_Halfpenny', '"1811"^^<http://www.w3.org/2001/XMLSchema#integer>')
    boundedDeathDate.set('http://dbpedia.org/resource/Mary_Ellen_Best', '"1891"^^<http://www.w3.org/2001/XMLSchema#integer>')
    boundedDeathDate.set('http://dbpedia.org/resource/William_Doughty_(painter)', '"1782"^^<http://www.w3.org/2001/XMLSchema#integer>')

    const iterator = client.execute(query)
    iterator.subscribe(b => {
      if (boundedDeathDate.has(b.get('?person'))) {
        nbBounded++
        expect(b.get('?deathDate')).to.equal(boundedDeathDate.get(b.get('?person')))
      } else {
        expect(b.get('?deathDate')).to.equal('UNBOUND')
      }
      results.push(b)
    }, done, () => {
      expect(results.length).to.equal(32)
      expect(nbBounded).to.equal(8)
      done()
    })
  }).timeout(2000)
})
