#!/usr/bin/env node
/* file : sage-client.js
MIT License

Copyright (c) 2018-2020 Thomas Minier

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

const fs = require('fs')
const program = require('commander')
const { SageClient, Spy } = require('../dist/lib.js')

// TODO wait for the SPARQL formatters that will be available in sparql-engine
// const JSONFormatter = require('../src/formatters/json-formatter.js')
// const XMLFormatter = require('sparql-engine/src/formatters/xml-formatter.js')
//
// const mimetypes = {
//   'application/json': JSONFormatter,
//   'application/sparql-results+json': JSONFormatter,
//   'json': JSONFormatter,
//   'application/xml': XMLFormatter,
//   'application/sparql-results+xml': XMLFormatter,
//   'xml': XMLFormatter
// }

// Command line interface to execute queries
program
  .description('Execute a SPARQL query using a SaGe server and the IRI of the default RDF graph')
  .usage('<server-url> <default-graph-iri> [options]')
  .option('-q, --query <query>', 'evaluates the given SPARQL query')
  .option('-f, --file <file>', 'evaluates the SPARQL query stored in the given file')
  // .option('-t, --type <mime-type>', 'determines the MIME type of the output (e.g., application/json)', 'application/json')
  .parse(process.argv)

// validate the number of CLI arguments
if (program.args.length !== 2) {
  process.stderr.write('Error: you must input exactly one server and one default graph IRI to use.\nSee sage-client --help for more details.\n')
  process.exit(1)
}

const server = program.args[0]
const defaultGraph = program.args[1]
const spy = new Spy()

// fetch SPARQL query to execute
let query = null
if (program.query) {
  query = program.query
} else if (program.file && fs.existsSync(program.file)) {
  query = fs.readFileSync(program.file, 'utf-8')
} else {
  process.stderr.write('Error: you must input a SPARQL query to execute.\nSee sage-client --help for more details.\n')
  process.exit(1)
}

const client = new SageClient(server, defaultGraph, spy)

const startTime = Date.now()
client.execute(query).subscribe(b => {
  console.log(b.toObject())
}, (error) => {
  console.error('ERROR: An error occurred during query execution.')
  console.error(error.stack)
}, () => {
  const endTime = Date.now()
  const time = endTime - startTime
  console.log(`SPARQL query evaluated in ${time / 1000}s with ${spy.nbHTTPCalls} HTTP request(s)`)
})
